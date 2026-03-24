-- ============================================================
-- RPC Functions for Supabase PostgREST
-- Replaces complex Drizzle ORM queries (GROUP BY, JOIN, pagination)
-- ============================================================

-- 1. get_usage_logs: paginated usage logs with device name join
CREATE OR REPLACE FUNCTION get_usage_logs(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_device_id uuid DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20,
  p_sort_by text DEFAULT 'date',
  p_sort_order text DEFAULT 'desc'
)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_offset int := (p_page - 1) * p_page_size;
  v_total int;
  v_total_kwh numeric(10,2);
  v_days int;
  v_rows json;
  v_order_col text;
  v_order_dir text;
BEGIN
  -- Validate sort params
  v_order_col := CASE WHEN p_sort_by = 'kwh' THEN 'ul.kwh' ELSE 'ul.date' END;
  v_order_dir := CASE WHEN p_sort_order = 'asc' THEN 'ASC' ELSE 'DESC' END;

  -- Count + summary
  SELECT count(*)::int, coalesce(sum(ul.kwh), 0)::numeric(10,2), count(DISTINCT ul.date)::int
  INTO v_total, v_total_kwh, v_days
  FROM usage_logs ul
  WHERE ul.user_id = p_user_id
    AND (p_start_date IS NULL OR ul.date >= p_start_date)
    AND (p_end_date IS NULL OR ul.date <= p_end_date)
    AND (p_device_id IS NULL OR ul.device_id = p_device_id);

  -- Fetch rows with device name
  EXECUTE format(
    'SELECT json_agg(t) FROM (
       SELECT ul.id, ul.device_id, d.name AS device_name,
              ul.date::text, ul.hour, ul.kwh::numeric(8,3)
       FROM usage_logs ul
       LEFT JOIN devices d ON ul.device_id = d.id
       WHERE ul.user_id = $1
         AND ($2::date IS NULL OR ul.date >= $2)
         AND ($3::date IS NULL OR ul.date <= $3)
         AND ($4::uuid IS NULL OR ul.device_id = $4)
       ORDER BY %s %s, ul.hour DESC
       LIMIT $5 OFFSET $6
     ) t',
    v_order_col, v_order_dir
  )
  INTO v_rows
  USING p_user_id, p_start_date, p_end_date, p_device_id, p_page_size, v_offset;

  RETURN json_build_object(
    'rows', coalesce(v_rows, '[]'::json),
    'total', v_total,
    'page', p_page,
    'pageSize', p_page_size,
    'totalPages', ceil(v_total::numeric / p_page_size)::int,
    'summary', json_build_object(
      'totalKwh', round(v_total_kwh::numeric, 2),
      'avgDailyKwh', round((v_total_kwh / greatest(v_days, 1))::numeric, 2),
      'days', greatest(v_days, 0)
    )
  );
END;
$$;

-- 2. get_weekly_usage_trend: last 7 days daily kWh
CREATE OR REPLACE FUNCTION get_weekly_usage_trend(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result json;
BEGIN
  SELECT json_agg(t ORDER BY t.date)
  INTO v_result
  FROM (
    SELECT ul.date::text AS date, sum(ul.kwh)::numeric(10,2) AS kwh
    FROM usage_logs ul
    WHERE ul.user_id = p_user_id
      AND ul.date >= current_date - 6
      AND ul.date <= current_date
    GROUP BY ul.date
  ) t;

  RETURN coalesce(v_result, '[]'::json);
END;
$$;

-- 3. get_monthly_usage_trend: last 12 months
CREATE OR REPLACE FUNCTION get_monthly_usage_trend(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result json;
BEGIN
  SELECT json_agg(t ORDER BY t.month)
  INTO v_result
  FROM (
    SELECT to_char(ul.date, 'YYYY-MM') AS month,
           sum(ul.kwh)::numeric(10,1) AS kwh
    FROM usage_logs ul
    WHERE ul.user_id = p_user_id
      AND ul.date >= date_trunc('month', current_date - interval '11 months')
      AND ul.date <= current_date
    GROUP BY to_char(ul.date, 'YYYY-MM')
  ) t;

  RETURN coalesce(v_result, '[]'::json);
END;
$$;

-- 4. get_category_usage: this month by category with device name
CREATE OR REPLACE FUNCTION get_category_usage(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result json;
BEGIN
  SELECT json_agg(t ORDER BY t.kwh DESC)
  INTO v_result
  FROM (
    SELECT d.category, d.name AS "deviceName",
           sum(ul.kwh)::numeric(10,2) AS kwh
    FROM usage_logs ul
    INNER JOIN devices d ON ul.device_id = d.id
    WHERE ul.user_id = p_user_id
      AND ul.date >= date_trunc('month', current_date)
      AND ul.date <= current_date
    GROUP BY d.category, d.name
  ) t;

  RETURN coalesce(v_result, '[]'::json);
END;
$$;

-- 5. get_usage_by_date_range: daily kWh for date range (shared tool)
CREATE OR REPLACE FUNCTION get_usage_by_date_range(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result json;
BEGIN
  SELECT json_agg(t ORDER BY t.date)
  INTO v_result
  FROM (
    SELECT ul.date::text AS date, sum(ul.kwh)::numeric(10,2) AS kwh
    FROM usage_logs ul
    WHERE ul.user_id = p_user_id
      AND ul.date >= p_start_date
      AND ul.date <= p_end_date
    GROUP BY ul.date
  ) t;

  RETURN coalesce(v_result, '[]'::json);
END;
$$;

-- 6. get_monthly_usage_summary: monthly summary with device ranking (shared tool)
CREATE OR REPLACE FUNCTION get_monthly_usage_summary(
  p_user_id uuid,
  p_year int,
  p_month int
)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_start_date date;
  v_end_date date;
  v_device_ranking json;
  v_total_kwh numeric;
  v_days_in_month int;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + interval '1 month')::date;
  v_days_in_month := extract(day FROM v_end_date - v_start_date)::int;

  SELECT json_agg(t ORDER BY t.kwh DESC), coalesce(sum(t.kwh), 0)
  INTO v_device_ranking, v_total_kwh
  FROM (
    SELECT coalesce(d.name, '未知設備') AS device,
           sum(ul.kwh)::numeric(10,2) AS kwh
    FROM usage_logs ul
    LEFT JOIN devices d ON ul.device_id = d.id
    WHERE ul.user_id = p_user_id
      AND ul.date >= v_start_date
      AND ul.date < v_end_date
    GROUP BY ul.device_id, d.name
  ) t;

  RETURN json_build_object(
    'year', p_year,
    'month', p_month,
    'totalKwh', round(v_total_kwh),
    'dailyAvgKwh', round(v_total_kwh / greatest(v_days_in_month, 1)),
    'co2Kg', round(v_total_kwh * 0.494),
    'deviceRanking', coalesce(v_device_ranking, '[]'::json)
  );
END;
$$;

-- 7. get_chat_sessions: paginated with search
CREATE OR REPLACE FUNCTION get_chat_sessions(
  p_user_id uuid,
  p_search text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_offset int := (p_page - 1) * p_page_size;
  v_total int;
  v_items json;
  v_keyword text;
BEGIN
  v_keyword := CASE WHEN p_search IS NOT NULL AND trim(p_search) <> ''
    THEN '%' || trim(p_search) || '%'
    ELSE NULL
  END;

  -- Count
  SELECT count(*)::int INTO v_total
  FROM chat_sessions cs
  WHERE cs.user_id = p_user_id
    AND (v_keyword IS NULL OR (
      cs.title ILIKE v_keyword
      OR EXISTS (
        SELECT 1 FROM chat_messages cm
        WHERE cm.session_id = cs.id AND cm.content ILIKE v_keyword
      )
    ));

  -- Fetch
  SELECT json_agg(t)
  INTO v_items
  FROM (
    SELECT cs.id, cs.title, cs.created_at, cs.updated_at
    FROM chat_sessions cs
    WHERE cs.user_id = p_user_id
      AND (v_keyword IS NULL OR (
        cs.title ILIKE v_keyword
        OR EXISTS (
          SELECT 1 FROM chat_messages cm
          WHERE cm.session_id = cs.id AND cm.content ILIKE v_keyword
        )
      ))
    ORDER BY cs.updated_at DESC
    LIMIT p_page_size OFFSET v_offset
  ) t;

  RETURN json_build_object(
    'items', coalesce(v_items, '[]'::json),
    'total', v_total,
    'page', p_page,
    'pageSize', p_page_size,
    'totalPages', ceil(v_total::numeric / p_page_size)::int
  );
END;
$$;
