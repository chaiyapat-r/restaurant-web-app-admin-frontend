"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		const apiUrl = process.env.NEXT_PUBLIC_API_URL;

		try {
			const response = await fetch(`${apiUrl}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
			}

			// เก็บ Token ลงใน LocalStorage (หรือ Cookies)
			localStorage.setItem("access_token", data.access_token);

			// เมื่อ Login สำเร็จ ส่งไปหน้า Dashboard
			router.push("/dashboard");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="min-h-screen w-full bg-[#F5F5F5] flex items-center justify-center p-4 md:p-8">
			<div className="w-full bg-white rounded-2xl shadow-sm p-6 sm:p-8 md:max-w-[450px] 2xl:max-w-[550px] 2xl:p-12 transition-all duration-300">
				<div className="mb-10 text-center md:text-left">
					<h1 className="text-3xl 2xl:text-4xl font-bold text-gray-900 mb-2">
						Log in
					</h1>
					<p className="text-gray-500 text-sm 2xl:text-base">
						Welcome back! Please log into your account
					</p>
				</div>

				{/* แสดง Error Message ถ้ามี */}
				{error && (
					<div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100">
						{error}
					</div>
				)}

				<form className="space-y-5 2xl:space-y-7" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<label className="text-xs 2xl:text-sm font-semibold text-gray-400 uppercase tracking-wider">
							Username
						</label>
						<input
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Username"
							className="w-full p-3 2xl:p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-200 transition-all"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-xs 2xl:text-sm font-semibold text-gray-400 uppercase tracking-wider">
							Password
						</label>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							className="w-full p-3 2xl:p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-200 transition-all"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className={`w-full bg-[#4A4A4A] text-white py-3.5 2xl:py-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] mt-4 ${
							isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-black"
						}`}
					>
						{isLoading ? "กำลังตรวจสอบ..." : "Log in"}
					</button>
				</form>
			</div>
		</main>
	);
}
