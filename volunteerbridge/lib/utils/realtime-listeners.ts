import { dbRef } from "@/lib/firebase/firestore";

export function startRealtimeListeners(): () => void {
  const requestRef = dbRef("Request");

  const requestStatusHandler = requestRef.on("child_changed", (snapshot) => {
    const requestId = snapshot.key;
    const status = snapshot.child("status").val();
    if (requestId && status) {
      console.log(`[realtime] Request status updated: ${requestId} -> ${status}`);
    }
  });

  const volunteerAssignmentHandler = requestRef.on("child_changed", (snapshot) => {
    const requestId = snapshot.key;
    const assignedVolunteerId = snapshot.child("assignedVolunteerId").val();
    if (requestId && assignedVolunteerId) {
      console.log(
        `[realtime] Volunteer assignment updated: request=${requestId}, volunteer=${assignedVolunteerId}`
      );
    }
  });

  return () => {
    requestRef.off("child_changed", requestStatusHandler);
    requestRef.off("child_changed", volunteerAssignmentHandler);
  };
}
