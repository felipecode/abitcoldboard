export type Member = {
  id: string;
  displayName: string;
};

export const MEMBERS: Member[] = [
  { id: "felipe", displayName: "Felipe" },
  { id: "alex", displayName: "Alex" },
  { id: "theo", displayName: "Theo" },
  { id: "luis", displayName: "Luis" },
  { id: "marc", displayName: "Marc" },
  { id: "saucepicant", displayName: "SaucePicant" },
];

export function getMember(id: string): Member | undefined {
  return MEMBERS.find((member) => member.id === id);
}
