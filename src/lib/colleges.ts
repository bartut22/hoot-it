// lib/colleges.ts
export const COLLEGES = [
  { id: 1, name: "Baker" },
  { id: 2, name: "Will Rice" },
  { id: 3, name: "Hanszen" },
  { id: 4, name: "Wiess" },
  { id: 5, name: "Jones" },
  { id: 6, name: "Brown" },
  { id: 7, name: "Lovett" },
  { id: 8, name: "Sid Richardson" },
  { id: 9, name: "Martel" },
  { id: 10, name: "McMurtry" },
  { id: 11, name: "Duncan" },
  { id: 12, name: "Chao" },
] as const

export function getCollegeId(name: string): number {
  return COLLEGES.find(c => c.name === name)?.id ?? -1
}

export function getCollegeName(id: number): string {
  return COLLEGES.find(c => c.id === id)?.name ?? 'Unknown'
}