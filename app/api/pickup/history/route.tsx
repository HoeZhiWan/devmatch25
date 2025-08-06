import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseUtils";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
    try {
        const q = query(collection(db, "pickups"), orderBy("verifiedAt", "desc"));
        const snapshot = await getDocs(q);

        const history = snapshot.docs.map((doc) => doc.data());

        return NextResponse.json({ history });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, message: "Error fetching history" },
            { status: 500 }
        );
    }
}
