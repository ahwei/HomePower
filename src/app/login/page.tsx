"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap, Loader2, Fingerprint } from "lucide-react";

const loginSchema = z.object({
  email: z.email("請輸入有效的 Email"),
  password: z.string().min(6, "密碼至少 6 個字元"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      if (data.session) {
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (
          aalData &&
          aalData.nextLevel === "aal2" &&
          aalData.currentLevel === "aal1"
        ) {
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const webauthnFactor = factorsData?.all?.find(
            (f) => f.factor_type === "webauthn" && f.status === "verified"
          );
          if (webauthnFactor) {
            setMfaFactorId(webauthnFactor.id);
            return;
          }
        }
        router.push("/");
        router.refresh();
      }
    } catch {
      setServerError("發生未預期的錯誤，請稍後再試。");
    }
  };

  const handlePasskeyVerify = async () => {
    if (!mfaFactorId) return;
    setServerError(null);
    setMfaLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.webauthn.authenticate({
        factorId: mfaFactorId,
      });
      if (error) {
        setServerError(error.message);
      } else if (data) {
        router.push("/");
        router.refresh();
        return;
      }
    } catch {
      setServerError("Passkey 驗證失敗，請再試一次。");
    }

    setMfaLoading(false);
  };

  if (mfaFactorId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Passkey 驗證</CardTitle>
            <CardDescription>
              請使用你的 Passkey 完成登入驗證
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <Button
              className="w-full"
              onClick={handlePasskeyVerify}
              disabled={mfaLoading}
            >
              {mfaLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Fingerprint className="mr-2 h-4 w-4" />
              驗證 Passkey
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMfaFactorId(null);
                setServerError(null);
              }}
            >
              返回登入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">HomePower</CardTitle>
          <CardDescription>
            家庭能源 Dashboard + 電費優化 AI 顧問
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              登入
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
