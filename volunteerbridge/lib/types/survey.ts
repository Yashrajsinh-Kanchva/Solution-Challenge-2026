export interface SurveyUpload {
	id: string;
	ngoId: string;
	fileName: string;
	uploadedAt: string;
	status: "pending" | "parsed" | "failed";
}
