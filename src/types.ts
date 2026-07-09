export interface RobloxUser {
  id: number;
  username: string;
  displayName: string;
  hasVerifiedBadge: boolean;
  avatarUrl: string;
}

export interface RobuxRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  robuxAmount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
  userNote: string;
  type: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  createdAt: string;
  read: boolean;
}

export interface RobuxPackage {
  id: string;
  amount: number;
  price: string;
  originalPrice?: string;
  isPopular?: boolean;
  color: string;
  bonusText?: string;
}
