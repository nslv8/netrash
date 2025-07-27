import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function getIdUserCookies(cookies) {
  return cookies.currentUser?.idAkun;
}

export async function getRoleNameUserCookies(cookies) {
  const role = await cookies.currentUser?.role;
  return role;
}

export function isRoleAdmin(cookies) {
  return cookies.currentUser?.roleName === "admin";
}
export function isRoleBSU(cookies) {
  return cookies.currentUser?.roleName === "bsu";
}
export function isStatusRejected(cookies) {
  return cookies.currentUser?.status === "Rejected";
}
export function getTokenUserCookies(cookies) {
  return cookies.currentUser?.token;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}