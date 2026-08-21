import apiClient from "@/lib/apiClient";
import { Category } from "@/types/category";

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get("/categories");

  console.log("CATEGORIES API:", response.data);

  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

export async function createCategory(data: {
  name: string;
  type: "income" | "expense";
}): Promise<Category> {
  const response = await apiClient.post("/categories", data);

  return response.data?.data ?? response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}