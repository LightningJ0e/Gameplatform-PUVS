import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  console.log("API /users/profile-image: POST request started");

  const token = await getJwtTokenFromCookie();

  if (!token) {
    console.log("API /users/profile-image: No valid token found");
    return NextResponse.json(
      { detail: "Missing or invalid auth token" },
      { status: 401 }
    );
  }

  try {
    // Get form data from request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    console.log("API /users/profile-image: Uploading file:", file.name);

    // Create new FormData for backend request
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    // Forward to UserService
    const response = await fetch(`${USER_BASE}/users/0/upload_image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    console.log(
      "API /users/profile-image: UserService response status:",
      response.status
    );

    let payload: any;
    try {
      payload = await response.json();
      console.log("API /users/profile-image: UserService payload:", payload);
    } catch (e) {
      const text = await response.text();
      payload = { detail: text || "Unknown error" };
      console.log(
        "API /users/profile-image: UserService text payload:",
        payload
      );
    }

    if (!response.ok) {
      console.log(
        "API /users/profile-image: UserService error:",
        response.status
      );
      return NextResponse.json(payload, { status: response.status });
    }

    console.log("API /users/profile-image: Success");
    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    console.log("API /users/profile-image: Error:", error.message);
    return NextResponse.json(
      { detail: "Failed to upload image" },
      { status: 500 }
    );
  }
}
