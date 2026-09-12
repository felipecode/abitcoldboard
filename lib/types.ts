export type ReferenceRecord = {
  id: string;
  image_path: string;
  caption: string | null;
  submitter: string;
  status: string;
  created_at: string;
};

export type ReferenceCard = ReferenceRecord & {
  url: string;
  submitterName: string;
};
