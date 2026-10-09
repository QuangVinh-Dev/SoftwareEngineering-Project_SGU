export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
