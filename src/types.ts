export interface Courier {
  id: string;
  name: string;
  phone: string;
  city: string;
  experience: string;
  apps: string[];
  createdAt: string;
  status: "جديد" | "تمت المقابلة" | "تم التفعيل";
  interviewDate?: string;
  interviewTime?: string;
  nationalId?: string;
  iban?: string;
  carPlate?: string;
  vehicleModel?: string;
  appCourierCode?: string;
  activationDate?: string;
  adminNotes?: string;
  supervisorId?: string; // Selected supervisor ID
  supervisorName?: string; // Selected supervisor Name
  supervisorPhone?: string; // Selected supervisor Phone number
  agreementAccepted?: boolean; // Has selected/accepted the work agreement document
  agreementAcceptedAt?: string; // Date of accepting the agreement
}

export interface DeliveryApp {
  id: string;
  name: string;
  logo: string;
  color: string;
  textColor: string;
  description: string;
  isAvailable?: boolean;
  region?: string;
  warningMessage?: string;
}
