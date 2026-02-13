"use client";
import { useEffect, useState } from "react";
import {
	Plus,
	ChevronLeft,
	ChevronRight,
	X,
	Loader2,
	Edit2,
	Trash2,
	AlertCircle
} from "lucide-react";

interface Category {
	id: number;
	name: string;
	disable: boolean;
	_count?: {
		menus: number;
	};
}

export default function CategoryPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	// --- States สำหรับ Modal Add/Edit ---
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [name, setName] = useState("");
	const [disable, setDisable] = useState("false");

	// --- States สำหรับ Modal Delete ---
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [deletingCategory, setDeletingCategory] = useState<Category | null>(
		null
	);

	const [isSubmitting, setIsSubmitting] = useState(false);

	// --- Pagination States ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(`${apiUrl}/categories`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				}
			});
			const data = await response.json();
			setCategories(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching categories:", error);
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	// --- Logic การเปิด Modal ---
	const handleAddClick = () => {
		setEditingCategory(null);
		setName("");
		setDisable("false");
		setIsModalOpen(true);
	};

	const handleEditClick = (category: Category) => {
		setEditingCategory(category);
		setName(category.name);
		setDisable(category.disable.toString());
		setIsModalOpen(true);
	};

	const handleDeleteClick = (category: Category) => {
		setDeletingCategory(category);
		setIsDeleteModalOpen(true);
	};

	// --- Logic การส่งข้อมูล (Create & Update) ---
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return alert("Please enter category name");

		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const method = editingCategory ? "PATCH" : "POST";
			const url = editingCategory
				? `${apiUrl}/categories/${editingCategory.id}`
				: `${apiUrl}/categories`;

			const response = await fetch(url, {
				method: method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify({
					name,
					disable: disable === "true"
				})
			});

			if (response.ok) {
				setIsModalOpen(false);
				fetchCategories();
			} else {
				throw new Error("Failed to save category");
			}
		} catch (error) {
			alert("Error saving category");
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Logic การลบข้อมูล ---
	const handleDeleteConfirm = async () => {
		if (!deletingCategory) return;
		setIsSubmitting(true);
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			const response = await fetch(
				`${apiUrl}/categories/${deletingCategory.id}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("access_token")}`
					}
				}
			);

			if (response.ok) {
				setIsDeleteModalOpen(false);
				setDeletingCategory(null);
				fetchCategories();
			} else {
				const errorData = await response.json();
				alert(
					errorData.message ||
						"Cannot delete category (it may have linked menus)"
				);
			}
		} catch (error) {
			alert("Error deleting category");
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Pagination Calculation ---
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = categories.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(categories.length / itemsPerPage);

	if (loading)
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="animate-spin h-10 w-10 text-gray-400" />
			</div>
		);

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Categories</h1>
					<p className="text-sm text-gray-500 mt-1">
						Manage your food categories
					</p>
				</div>
				<button
					onClick={handleAddClick}
					className="bg-[#4E89C4] hover:bg-[#3d6fa1] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-blue-100"
				>
					<Plus size={20} />
					Add Category
				</button>
			</div>

			{/* Table Section */}
			<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
				<table className="w-full text-left">
					<thead className="bg-gray-50/50 border-b border-gray-100">
						<tr>
							<th className="px-8 py-5 text-sm font-semibold text-gray-600">
								ID
							</th>
							<th className="px-8 py-5 text-sm font-semibold text-gray-600">
								Name
							</th>
							<th className="px-8 py-5 text-sm font-semibold text-gray-600">
								Status
							</th>
							<th className="px-8 py-5 text-sm font-semibold text-gray-600 text-right">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-50">
						{currentItems.map((cat) => (
							<tr
								key={cat.id}
								className="hover:bg-gray-50/50 transition-colors"
							>
								<td className="px-8 py-5 text-sm text-gray-500 font-medium">
									#{cat.id}
								</td>
								<td className="px-8 py-5">
									<span className="text-sm font-bold text-gray-700">
										{cat.name}
									</span>
								</td>
								<td className="px-8 py-5">
									<span
										className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
											cat.disable
												? "bg-red-50 text-red-500 border border-red-100"
												: "bg-green-50 text-green-600 border border-green-100"
										}`}
									>
										{cat.disable ? "Disabled" : "Active"}
									</span>
								</td>
								<td className="px-8 py-5 text-right">
									<div className="flex justify-end gap-2">
										<button
											onClick={() => handleEditClick(cat)}
											className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
										>
											<Edit2 size={18} />
										</button>
										<button
											onClick={() => handleDeleteClick(cat)}
											className="p-2 text-gray-400 hover:text-red-500 transition-colors"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* Empty State */}
				{categories.length === 0 && (
					<div className="p-20 text-center text-gray-400 font-medium">
						No categories found.
					</div>
				)}

				{/* Pagination Section */}
				<div className="px-8 py-5 bg-white border-t border-gray-50 flex items-center justify-between">
					<p className="text-sm text-gray-500 font-medium">
						Showing{" "}
						<span className="text-gray-900">{indexOfFirstItem + 1}</span> to{" "}
						<span className="text-gray-900">
							{Math.min(indexOfLastItem, categories.length)}
						</span>{" "}
						of <span className="text-gray-900">{categories.length}</span>{" "}
						results
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
						>
							<ChevronLeft size={20} />
						</button>
						<button
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages || totalPages === 0}
							className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>
			</div>

			{/* --- Add / Edit Modal --- */}
			{isModalOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
						<div className="flex justify-between items-center mb-8">
							<h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
								{editingCategory ? "Edit Category" : "Add New Category"}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-1 hover:bg-gray-100 rounded-full transition-colors"
							>
								<X size={24} className="text-gray-400" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-2">
								<label className="text-xs font-black text-gray-400 uppercase ml-1">
									Category Name
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Italian Pasta"
									className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700"
									required
								/>
							</div>

							<div className="space-y-2">
								<label className="text-xs font-black text-gray-400 uppercase ml-1">
									Disable Status
								</label>
								<div className="relative">
									<select
										value={disable}
										onChange={(e) => setDisable(e.target.value)}
										className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700 appearance-none cursor-pointer"
									>
										<option value="false">False</option>
										<option value="true">True</option>
									</select>
									<div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
										<ChevronRight
											size={18}
											className="rotate-90 text-gray-400"
										/>
									</div>
								</div>
							</div>

							<div className="flex gap-4 pt-4">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									disabled={isSubmitting}
									className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="flex-1 py-4 bg-[#4E89C4] text-white rounded-2xl font-bold hover:bg-[#3d6fa1] transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center"
								>
									{isSubmitting ? (
										<Loader2 className="animate-spin mr-2" size={20} />
									) : editingCategory ? (
										"Update"
									) : (
										"Create"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* --- Delete Confirmation Modal --- */}
			{isDeleteModalOpen && (
				<div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
					/>
					<div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 animate-in fade-in zoom-in duration-200 text-center">
						<div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle size={32} />
						</div>
						<h2 className="text-xl font-bold text-gray-800 mb-2">
							Confirm Delete?
						</h2>
						<p className="text-gray-500 mb-8 text-sm leading-relaxed">
							Are you sure you want to delete{" "}
							<span className="font-bold text-gray-800">
								"{deletingCategory?.name}"
							</span>
							? <br />
							This action cannot be undone.
						</p>

						<div className="flex gap-3">
							<button
								onClick={() => setIsDeleteModalOpen(false)}
								disabled={isSubmitting}
								className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={isSubmitting}
								className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 flex items-center justify-center active:scale-95"
							>
								{isSubmitting ? (
									<Loader2 className="animate-spin" size={20} />
								) : (
									"Yes, Delete"
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
