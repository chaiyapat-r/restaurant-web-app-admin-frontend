import { redirect } from "next/navigation";

export default function RootPage() {
	// ในอนาคตเราจะเช็ค Token ตรงนี้
	const isAuthenticated = false;

	if (!isAuthenticated) {
		redirect("/login");
	} else {
		redirect("/dashboard");
	}
}
