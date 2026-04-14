/** Ссылки на магазины приложений (NEXT_PUBLIC_* подставляются на сборке). */

export function getAndroidAppUrl(): string {
  const v = process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim();
  return v && v.length > 0 ? v : "#";
}

export function getIosAppUrl(): string {
  const v = process.env.NEXT_PUBLIC_IOS_APP_URL?.trim();
  return v && v.length > 0 ? v : "#";
}
