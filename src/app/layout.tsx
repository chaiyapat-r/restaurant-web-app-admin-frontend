import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Import ฟอนต์ Inter
import "./globals.css";

// 2. ตั้งค่าฟอนต์
const inter = Inter({
	subsets: ["latin"],
	display: "swap" // ช่วยให้ข้อความแสดงทันทีด้วยฟอนต์สำรองก่อน Inter จะโหลดเสร็จ
});

export const metadata: Metadata = {
	title: "Admin Restuarant",
	description: "Restaurant Management System"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			{/* 3. นำชื่อ class ไปใส่ใน body */}
			<body className={inter.className}>{children}</body>
		</html>
	);
}
