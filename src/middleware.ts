import { NextResponse } from "next/server";

// i18n is scaffolded via next-intl (see src/i18n/*) but with only English
// active in v1 we don't route by locale segment. Re-enable next-intl's
// middleware in v2 when French (Quebec) lands.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
