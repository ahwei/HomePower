-- Create storage buckets for avatars and device images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('device-images', 'device-images', true);

-- RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS policies for device-images bucket
CREATE POLICY "Anyone can view device images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'device-images');

CREATE POLICY "Users can upload their own device images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'device-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own device images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'device-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own device images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'device-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
