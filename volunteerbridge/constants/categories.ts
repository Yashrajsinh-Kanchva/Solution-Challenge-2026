export const NEED_CATEGORIES = [
	"Food",
	"Health",
	"Shelter",
	"Education",
	"Employment",
	"Safety",
] as const;

export type NeedCategory = (typeof NEED_CATEGORIES)[number];
