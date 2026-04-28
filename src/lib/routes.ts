export function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(ro|en)/, '') || '/';
}

export function matchesPathSection(pathname: string, section: string): boolean {
  const stripped = stripLocale(pathname);
  return stripped === section || stripped.startsWith(`${section}/`);
}
