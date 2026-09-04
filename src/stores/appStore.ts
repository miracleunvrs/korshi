import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PostWithAuthor, UserRole } from "@/types";
import type { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@supabase/supabase-js";
import {
  deleteClassified as deleteClassifiedRemote,
  deleteComment as deleteCommentRemote,
  deleteMessage as deleteMessageRemote,
  deletePost as deletePostRemote,
  createDirectChat as createDirectChatRemote,
  hydrateDomainData,
  persistClassified,
  persistComment,
  persistFundraiser,
  persistHouseDocument,
  persistInitiativeSupport,
  persistMessage,
  persistPollVote,
  persistPost,
  persistProfileUpdate,
  persistReaction,
  persistServiceRequest,
  persistServiceRequestComment,
  persistServiceRequestRating,
  persistServiceRequestReopen,
  persistServiceRequestStatus,
  persistDocumentAcknowledgement,
  persistDocumentArchive,
  persistOfficialVoteChoice,
  persistEmergencyAlert,
  persistEmergencyAcknowledgement,
  removeReaction,
  recordFundraiserPayment,
  recordFinanceTransaction,
  persistAmenityBooking,
  persistVisitorPass,
  persistResidentVehicle,
  reviewVerificationRequest,
  submitVerificationRequest as submitVerificationRequestRemote,
} from "@/lib/supabase/repository";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string | null | undefined) => Boolean(value && UUID_RE.test(value));

export interface UserAccount {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  roleLabel: string;
  buildingNumber: string;
  complexId?: string;
  complexName?: string;
  complexAddress?: string;
  buildingId?: string;
  entranceId?: string;
  entranceNumber: number;
  apartmentNumber: string;
  verified: boolean;
  avatarUrl: string;
  bio?: string;
}

export interface MessageItem {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isOfficial?: boolean;
  isMe: boolean;
  text: string;
  time: string;
}

export interface ChatItem {
  id: string;
  name: string;
  type: "complex" | "building" | "entrance" | "thematic" | "direct";
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatarColor: string;
  icon: string;
  isOfficial?: boolean;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  buildingNumber: string;
  entranceNumber: number;
  apartmentNumber: string;
  documentType: string;
  documentUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface ClassifiedItem {
  id: string;
  title: string;
  category: "Объявления" | "Услуги" | "Подработки" | "Помощь";
  price: string;
  location: string;
  image: string;
  description: string;
  authorId: string;
  authorName: string;
  authorPhone: string;
  createdAt: string;
}

export type ServiceRequestStatus = "submitted" | "in_progress" | "resolved" | "closed";
export type ServiceRequestPriority = "normal" | "important" | "emergency";
export type ServiceRequestCategory = "utilities" | "cleaning" | "repair" | "safety" | "territory" | "other";

export interface ServiceRequestItem {
  id: string;
  userId: string;
  complexId: string;
  category: ServiceRequestCategory;
  title: string;
  description: string;
  location: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  publicForComplex: boolean;
  assigneeName?: string;
  slaDueAt?: string;
  resolutionNote?: string;
  rating?: number;
  attachments: ServiceRequestAttachment[];
  events: ServiceRequestEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestAttachment {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: "evidence" | "resolution";
}

export interface ServiceRequestEvent {
  id: string;
  kind: "created" | "comment" | "assigned" | "status_changed" | "resolution" | "rated" | "reopened";
  actorName: string;
  actorRole?: UserRole;
  message?: string;
  createdAt: string;
}

export type HouseDocumentCategory = "finance" | "protocol" | "rules" | "contract" | "notice" | "report" | "other";

export interface HouseDocument {
  id: string;
  complexId: string;
  title: string;
  description: string;
  category: HouseDocumentCategory;
  version: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  isImportant: boolean;
  requiresAcknowledgement: boolean;
  acknowledged: boolean;
  status: "active" | "archived";
  publishedBy: string;
  publishedAt: string;
  searchableText?: string;
  scopeLabel?: string;
}

export type OfficialVoteChoice = "yes" | "no" | "abstain";

export interface OfficialVoteItem {
  id: string;
  complexId: string;
  title: string;
  description: string;
  basis: "owner" | "area";
  quorumPercent: number;
  participationPercent: number;
  eligibleUnits: number;
  eligibleWeight: number;
  status: "draft" | "active" | "completed" | "cancelled";
  startsAt: string;
  endsAt: string;
  results: Record<OfficialVoteChoice, number>;
  userChoice?: OfficialVoteChoice;
  protocolUrl?: string;
}

export interface FinanceTransaction {
  id: string;
  direction: "income" | "expense";
  category: string;
  title: string;
  amount: number;
  occurredOn: string;
  documentId?: string;
}

export interface FinanceBudgetItem {
  id: string;
  category: string;
  planned: number;
  actual: number;
}

export interface FinanceOverview {
  balance: number;
  income: number;
  expense: number;
  currency: "KZT";
  transactions: FinanceTransaction[];
  budget: FinanceBudgetItem[];
}

export interface HomeScheduleItem {
  id: string;
  kind: "cleaning" | "maintenance" | "outage" | "event";
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt?: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
}

export interface AmenityResource {
  id: string;
  name: string;
  description: string;
  location: string;
  capacity?: number;
  price: number;
  kind?: "room" | "sport" | "bbq" | "freight_lift" | "parking";
  rules?: string;
  requiresApproval?: boolean;
}

export interface AmenityBooking {
  id: string;
  resourceId: string;
  startsAt: string;
  endsAt: string;
  status: "confirmed" | "cancelled" | "completed";
  approvalStatus?: "pending" | "approved" | "rejected";
  paymentStatus?: "not_required" | "pending" | "paid";
}

export interface VisitorPass {
  id: string;
  guestName: string;
  kind: "guest" | "courier" | "vehicle";
  vehiclePlate?: string;
  accessCode: string;
  validFrom: string;
  validUntil: string;
  status: "active" | "used" | "revoked" | "expired";
}

export interface ResidentVehicle {
  id: string;
  plate: string;
  label: string;
}

export type NotificationPreferenceKey = "requests" | "community" | "finance" | "emergency";

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  affectedAreas: string[];
  expectedResolution?: string;
  contactPhone?: string;
  active: boolean;
  acknowledged: boolean;
  createdAt: string;
}

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: "user-1",
    fullName: "Мария Иванова",
    phone: "+7 (777) 234-56-78",
    email: "maria@housesm.kz",
    role: "resident",
    roleLabel: "Собственник (Дом 2)",
    buildingNumber: "2",
    entranceNumber: 1,
    apartmentNumber: "45",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bio: "Живу в ЖК с 2023 года. Люблю порядок и зеленый двор!",
  },
  {
    id: "user-2",
    fullName: "Алексей Петров",
    phone: "+7 (701) 444-55-66",
    email: "alex@housesm.kz",
    role: "resident",
    roleLabel: "Собственник (Дом 1)",
    buildingNumber: "1",
    entranceNumber: 2,
    apartmentNumber: "12",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bio: "Инициатор установки камер в подъезде 2.",
  },
  {
    id: "user-hoa",
    fullName: "ОСИ «Солнечный»",
    phone: "+7 (727) 123-45-67",
    email: "osi@housesm.kz",
    role: "hoa_official",
    roleLabel: "Председатель ОСИ",
    buildingNumber: "1",
    entranceNumber: 1,
    apartmentNumber: "Офис ОСИ",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=200&auto=format&fit=crop&q=80",
    bio: "Официальный орган управления жилым комплексом.",
  },
  {
    id: "user-master",
    fullName: "Олег Смирнов",
    phone: "+7 (775) 123-99-88",
    email: "oleg.electrician@housesm.kz",
    role: "service_provider",
    roleLabel: "Мастер-электрик ЖК",
    buildingNumber: "1",
    entranceNumber: 1,
    apartmentNumber: "3",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bio: "Электрика любой сложности в нашем ЖК. Опыт 10 лет.",
  },
  {
    id: "user-admin",
    fullName: "Администратор Сообщества",
    phone: "+7 (777) 000-11-22",
    email: "admin@housesm.kz",
    role: "admin",
    roleLabel: "Администратор ЖК",
    buildingNumber: "2",
    entranceNumber: 2,
    apartmentNumber: "100",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    bio: "Модерация социальной сети и верификация жителей.",
  },
];

export interface RegistrationResult {
  account: UserAccount;
  requiresEmailConfirmation: boolean;
}

function roleLabel(role: UserRole, buildingNumber: string) {
  if (role === "service_provider") return "Мастер услуг ЖК";
  if (role === "hoa_official") return "Представитель ОСИ";
  if (role === "admin") return "Администратор ЖК";
  return buildingNumber ? `Житель (Дом ${buildingNumber})` : "Житель";
}

function accountFromAuthMetadata(user: User): UserAccount {
  const metadata = user.user_metadata || {};
  const role: UserRole = metadata.role === "service_provider" ? "service_provider" : "resident";
  const buildingNumber = String(metadata.building_number || "");

  return {
    id: user.id,
    fullName: String(metadata.full_name || user.email || user.phone || "Пользователь"),
    phone: user.phone || String(metadata.phone || ""),
    email: user.email,
    role,
    roleLabel: roleLabel(role, buildingNumber),
    buildingNumber,
    complexId: String(metadata.complex_id || "") || undefined,
    complexName: String(metadata.complex_name || "") || undefined,
    complexAddress: String(metadata.complex_address || "") || undefined,
    entranceNumber: Number(metadata.entrance_number) || 1,
    apartmentNumber: String(metadata.apartment_number || ""),
    verified: false,
    avatarUrl: String(metadata.avatar_url || ""),
  };
}

async function loadAccount(user: User): Promise<UserAccount> {
  const supabase = createClient();
  const fallback = accountFromAuthMetadata(user);
  const profileResult = await supabase
    .from("profiles")
    .select("id, phone, full_name, avatar_url, role, apartment_id, complex_id, verified, bio")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileResult.data as Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "phone" | "full_name" | "avatar_url" | "role" | "apartment_id" | "complex_id" | "verified" | "bio"
  > | null;

  if (profileResult.error) throw profileResult.error;
  if (!profile) return fallback;

  let buildingNumber = fallback.buildingNumber;
  let entranceNumber = fallback.entranceNumber;
  let apartmentNumber = fallback.apartmentNumber;
  let currentComplexName = fallback.complexName;
  let currentComplexAddress = fallback.complexAddress;

  if (profile.complex_id) {
    const complexResult = await supabase
      .from("complexes")
      .select("name, address, city")
      .eq("id", profile.complex_id)
      .maybeSingle();
    const complexData = complexResult.data as { name: string; address: string; city: string } | null;
    if (complexData) {
      currentComplexName = complexData.name;
      currentComplexAddress = [complexData.city, complexData.address].filter(Boolean).join(", ");
    }
  }

  if (profile.apartment_id) {
    const apartmentResult = await supabase
      .from("apartments")
      .select("number, entrance_id")
      .eq("id", profile.apartment_id)
      .maybeSingle();
    const apartment = apartmentResult.data as Pick<
      Database["public"]["Tables"]["apartments"]["Row"],
      "number" | "entrance_id"
    > | null;

    if (apartment) {
      apartmentNumber = apartment.number;
      const entranceResult = await supabase
        .from("entrances")
        .select("number, building_id")
        .eq("id", apartment.entrance_id)
        .maybeSingle();
      const entrance = entranceResult.data as Pick<
        Database["public"]["Tables"]["entrances"]["Row"],
        "number" | "building_id"
      > | null;

      if (entrance) {
        entranceNumber = entrance.number;
        const buildingResult = await supabase
          .from("buildings")
          .select("number")
          .eq("id", entrance.building_id)
          .maybeSingle();
        const building = buildingResult.data as Pick<
          Database["public"]["Tables"]["buildings"]["Row"],
          "number"
        > | null;
        if (building) buildingNumber = building.number;
      }
    }
  }

  return {
    id: user.id,
    fullName: profile.full_name || fallback.fullName,
    phone: profile.phone || fallback.phone,
    email: user.email,
    role: profile.role,
    roleLabel: roleLabel(profile.role, buildingNumber),
    buildingNumber,
    complexId: profile.complex_id || undefined,
    complexName: currentComplexName,
    complexAddress: currentComplexAddress,
    entranceNumber,
    apartmentNumber,
    verified: profile.verified,
    avatarUrl: profile.avatar_url || fallback.avatarUrl,
    bio: profile.bio || undefined,
  };
}

function mergeAccount(users: UserAccount[], account: UserAccount) {
  return [
    account,
    ...users.filter(
      (user) =>
        user.id !== account.id &&
        (!account.email || user.email?.toLowerCase() !== account.email.toLowerCase())
    ),
  ];
}

export interface AppState {
  // Аутентификация
  currentUser: UserAccount;
  registeredUsers: UserAccount[];
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  supabaseUserId: string | null;

  registerUser: (data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    buildingNumber: string;
    entranceNumber: number;
    apartmentNumber: string;
    role?: UserRole;
  }) => Promise<RegistrationResult>;

  loginUser: (email: string, password: string) => Promise<UserAccount>;
  resetPassword: (email: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  syncAuthState: () => Promise<void>;
  setVerified: (verified: boolean) => void;
  updateUser: (data: Partial<UserAccount>) => void;
  backendError: string | null;
  clearBackendError: () => void;
  hydrateDomainData: () => Promise<void>;
  notifications: AppNotification[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  notificationPreferences: Record<NotificationPreferenceKey, boolean>;
  setNotificationPreference: (key: NotificationPreferenceKey, enabled: boolean) => void;

  // Заявки в управляющую организацию
  serviceRequests: ServiceRequestItem[];
  createServiceRequest: (
    data: Pick<ServiceRequestItem, "category" | "title" | "description" | "location" | "priority" | "publicForComplex">,
    files?: File[],
  ) => Promise<void>;
  addServiceRequestComment: (requestId: string, message: string) => Promise<void>;
  rateServiceRequest: (requestId: string, rating: number) => Promise<void>;
  reopenServiceRequest: (requestId: string, message: string) => Promise<void>;
  updateServiceRequestStatus: (
    requestId: string,
    status: ServiceRequestStatus,
    options?: { note?: string; assigneeName?: string; slaDueAt?: string },
  ) => Promise<void>;

  // Документы дома
  documents: HouseDocument[];
  addHouseDocument: (
    data: Pick<HouseDocument, "title" | "description" | "category" | "version" | "isImportant" | "requiresAcknowledgement">,
    file: File,
  ) => Promise<void>;
  acknowledgeDocument: (documentId: string) => Promise<void>;
  archiveDocument: (documentId: string) => Promise<void>;

  // Управление домом и прозрачные финансы
  officialVotes: OfficialVoteItem[];
  castOfficialVote: (voteId: string, choice: OfficialVoteChoice) => Promise<void>;
  finance: FinanceOverview;
  addFinanceTransaction: (data: Omit<FinanceTransaction, "id">) => Promise<void>;
  scheduleItems: HomeScheduleItem[];
  amenityResources: AmenityResource[];
  amenityBookings: AmenityBooking[];
  visitorPasses: VisitorPass[];
  residentVehicles: ResidentVehicle[];
  createAmenityBooking: (resourceId: string, startsAt: string, endsAt: string) => Promise<void>;
  createVisitorPass: (data: Pick<VisitorPass, "guestName" | "kind" | "vehiclePlate" | "validUntil">) => Promise<void>;
  addResidentVehicle: (plate: string, label: string) => Promise<void>;

  // Экстренные оповещения ОСИ
  urgentAlert: EmergencyAlert | null;
  setUrgentAlert: (alert: EmergencyAlert | null) => Promise<void>;
  acknowledgeUrgentAlert: () => Promise<void>;

  // Заявки на верификацию
  verificationRequests: VerificationRequest[];
  approveVerification: (requestId: string) => void;
  rejectVerification: (requestId: string) => void;

  // Посты и лента
  posts: PostWithAuthor[];
  addPost: (post: PostWithAuthor) => void;
  deletePost: (postId: string) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  votePoll: (postId: string, optionId: string) => void;
  supportInitiative: (initiativeId: string) => void;
  addComment: (postId: string, commentText: string) => void;
  deleteComment: (postId: string, commentId: string) => void;

  // Комментарии
  postComments: Record<string, Array<{ id: string; authorName: string; isOfficial: boolean; text: string; time: string }>>;

  // Чаты
  chats: ChatItem[];
  messages: Record<string, MessageItem[]>;
  sendMessage: (chatId: string, text: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  createDirectChatWith: (authorId: string, authorName: string) => Promise<string>;

  // Объявления
  classifieds: ClassifiedItem[];
  addClassified: (item: ClassifiedItem) => void;
  deleteClassified: (itemId: string) => void;

  // Сборы
  donateToFundraiser: (fundraiserId: string, amount: number) => Promise<void>;
  createFundraiser: (data: {
    title: string;
    content: string;
    targetAmount: number;
    currency?: string;
    endsAt?: string;
  }) => void;
  submitVerificationRequest: (data: Omit<VerificationRequest, "id" | "userId" | "status" | "submittedAt" | "documentUrl"> & { documentPath: string }) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_ACCOUNTS[0],
      registeredUsers: DEFAULT_ACCOUNTS,
      isLoggedIn: !isSupabaseConfigured(),
      isAuthLoading: isSupabaseConfigured(),
      supabaseUserId: null,
      backendError: null,
      notifications: [
        {
          id: "notification-request-demo",
          type: "service_request",
          title: "Заявка принята в работу",
          body: "Служба эксплуатации назначена на заявку «Не работает освещение на этаже».",
          data: { service_request_id: "service-request-1" },
          isRead: false,
          createdAt: "Сегодня, 10:05",
        },
        {
          id: "notification-vote-demo",
          type: "vote",
          title: "Голосование завершится завтра",
          body: "Успейте принять участие в решении по благоустройству двора.",
          data: { post_id: "post-3" },
          isRead: false,
          createdAt: "Сегодня, 09:00",
        },
        {
          id: "notification-document-demo",
          type: "document",
          title: "Опубликован отчёт ОСИ",
          body: "Финансовый отчёт за август доступен в центре документов.",
          data: { document_id: "document-1" },
          isRead: true,
          createdAt: "Вчера, 18:20",
        },
      ],
      notificationPreferences: {
        requests: true,
        community: true,
        finance: true,
        emergency: true,
      },
      setNotificationPreference: (key, enabled) => set((state) => ({
        notificationPreferences: { ...state.notificationPreferences, [key]: enabled },
      })),
      serviceRequests: [
        {
          id: "service-request-1",
          userId: "user-1",
          complexId: "complex-1",
          category: "repair",
          title: "Не работает освещение на этаже",
          description: "Лампа возле лифта не включается второй день.",
          location: "Дом 2 · подъезд 1 · 7 этаж",
          status: "in_progress",
          priority: "normal",
          publicForComplex: true,
          assigneeName: "Служба эксплуатации",
          slaDueAt: "Сегодня, 18:00",
          attachments: [],
          events: [
            { id: "request-event-1", kind: "created", actorName: "Мария Иванова", message: "Лампа возле лифта не включается второй день.", createdAt: "Сегодня, 09:20" },
            { id: "request-event-2", kind: "assigned", actorName: "ОСИ «Солнечный»", message: "Назначена служба эксплуатации", createdAt: "Сегодня, 10:05" },
          ],
          createdAt: "Сегодня, 09:20",
          updatedAt: "Сегодня, 10:05",
        },
        {
          id: "service-request-2",
          userId: "user-1",
          complexId: "complex-1",
          category: "cleaning",
          title: "Уборка входной группы",
          description: "После доставки осталась упаковка у входа.",
          location: "Дом 2 · подъезд 1",
          status: "resolved",
          priority: "normal",
          publicForComplex: false,
          assigneeName: "Клининг",
          resolutionNote: "Входная группа очищена, упаковка вывезена.",
          attachments: [],
          events: [
            { id: "request-event-3", kind: "created", actorName: "Мария Иванова", createdAt: "Вчера, 17:42" },
            { id: "request-event-4", kind: "resolution", actorName: "Клининг", message: "Уборка выполнена", createdAt: "Сегодня, 08:10" },
          ],
          createdAt: "Вчера, 17:42",
          updatedAt: "Сегодня, 08:10",
        },
      ],
      documents: [
        {
          id: "document-1",
          complexId: "complex-1",
          title: "Финансовый отчёт за август",
          description: "Поступления, обязательные расходы и остаток средств ОСИ за месяц.",
          category: "finance",
          version: "1.0",
          fileName: "finance-august.pdf",
          mimeType: "application/pdf",
          sizeBytes: 824000,
          isImportant: true,
          requiresAcknowledgement: false,
          acknowledged: false,
          status: "active",
          publishedBy: "ОСИ «Солнечный»",
          publishedAt: "Вчера, 18:20",
        },
        {
          id: "document-2",
          complexId: "complex-1",
          title: "Правила пожарной безопасности",
          description: "Порядок действий при пожаре и требования к эвакуационным выходам.",
          category: "rules",
          version: "2.1",
          fileName: "fire-safety.pdf",
          mimeType: "application/pdf",
          sizeBytes: 462000,
          isImportant: true,
          requiresAcknowledgement: true,
          acknowledged: false,
          status: "active",
          publishedBy: "ОСИ «Солнечный»",
          publishedAt: "2 сентября, 12:10",
        },
        {
          id: "document-3",
          complexId: "complex-1",
          title: "Протокол собрания №8",
          description: "Решения по освещению паркинга и графику обслуживания лифтов.",
          category: "protocol",
          version: "1.0",
          fileName: "protocol-08.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1130000,
          isImportant: false,
          requiresAcknowledgement: false,
          acknowledged: false,
          status: "active",
          publishedBy: "ОСИ «Солнечный»",
          publishedAt: "28 августа, 16:40",
        },
      ],
      officialVotes: [
        {
          id: "official-vote-1",
          complexId: "complex-1",
          title: "Благоустройство детской площадки",
          description: "Утвердить смету 4 800 000 ₸ на безопасное покрытие, освещение и новое игровое оборудование.",
          basis: "area",
          quorumPercent: 51,
          participationPercent: 46,
          eligibleUnits: 120,
          eligibleWeight: 12000,
          status: "active",
          startsAt: "1 сентября, 09:00",
          endsAt: "6 сентября, 21:00",
          results: { yes: 4200, no: 840, abstain: 480 },
        },
        {
          id: "official-vote-2",
          complexId: "complex-1",
          title: "График обслуживания лифтов",
          description: "Утверждение годового договора на техническое обслуживание лифтового оборудования.",
          basis: "owner",
          quorumPercent: 51,
          participationPercent: 68,
          eligibleUnits: 120,
          eligibleWeight: 120,
          status: "completed",
          startsAt: "12 августа, 09:00",
          endsAt: "19 августа, 21:00",
          results: { yes: 70, no: 8, abstain: 4 },
          userChoice: "yes",
        },
      ],
      finance: {
        balance: 2142500,
        income: 3680000,
        expense: 1537500,
        currency: "KZT",
        budget: [
          { id: "budget-1", category: "Содержание дома", planned: 9600000, actual: 6210000 },
          { id: "budget-2", category: "Лифты", planned: 3200000, actual: 2440000 },
          { id: "budget-3", category: "Благоустройство", planned: 4800000, actual: 1180000 },
          { id: "budget-4", category: "Безопасность", planned: 2100000, actual: 1370000 },
        ],
        transactions: [
          { id: "finance-1", direction: "income", category: "Взносы", title: "Ежемесячные взносы жителей", amount: 3680000, occurredOn: "2 сентября" },
          { id: "finance-2", direction: "expense", category: "Лифты", title: "Техническое обслуживание", amount: 620000, occurredOn: "3 сентября", documentId: "document-1" },
          { id: "finance-3", direction: "expense", category: "Уборка", title: "Клининг общих зон", amount: 487500, occurredOn: "2 сентября" },
          { id: "finance-4", direction: "expense", category: "Безопасность", title: "Обслуживание камер", amount: 430000, occurredOn: "1 сентября" },
        ],
      },
      scheduleItems: [
        { id: "schedule-1", kind: "outage", title: "Отключение холодной воды", description: "Замена насосного оборудования", location: "Дом 1 и Дом 2", startsAt: "Завтра, 10:00", endsAt: "Завтра, 14:00", status: "planned" },
        { id: "schedule-2", kind: "maintenance", title: "Обслуживание лифтов", description: "Проверка датчиков безопасности", location: "Дом 2 · подъезд 1", startsAt: "6 сентября, 09:00", endsAt: "6 сентября, 12:00", status: "planned" },
        { id: "schedule-3", kind: "cleaning", title: "Уборка паркинга", description: "Механизированная уборка уровня −1", location: "Паркинг", startsAt: "8 сентября, 08:00", endsAt: "8 сентября, 11:00", status: "planned" },
      ],
      amenityResources: [
        { id: "resource-1", name: "Переговорная ОСИ", description: "Комната для собраний и занятий", location: "Дом 1 · 1 этаж", capacity: 12, price: 0, kind: "room", rules: "До 2 часов в день", requiresApproval: false },
        { id: "resource-2", name: "Мангальная зона", description: "Закрытая дворовая зона со столом", location: "Внутренний двор", capacity: 8, price: 3000, kind: "bbq", rules: "Убрать территорию после использования", requiresApproval: true },
        { id: "resource-3", name: "Грузовой лифт", description: "Бронирование для переезда", location: "Выбранный подъезд", price: 0, kind: "freight_lift", rules: "Защитные панели устанавливает консьерж", requiresApproval: true },
        { id: "resource-4", name: "Спортивная площадка", description: "Мини-футбол и тренировки", location: "Южный двор", capacity: 16, price: 0, kind: "sport", rules: "Не более 90 минут", requiresApproval: false },
        { id: "resource-5", name: "Гостевое парковочное место", description: "Краткосрочная парковка для гостей", location: "Северный въезд", price: 500, kind: "parking", rules: "До 8 часов", requiresApproval: false },
      ],
      amenityBookings: [
        { id: "booking-1", resourceId: "resource-1", startsAt: "7 сентября, 18:00", endsAt: "7 сентября, 19:30", status: "confirmed" },
      ],
      visitorPasses: [
        { id: "pass-1", guestName: "Александр · курьер", kind: "courier", accessCode: "K7P4-28Q", validFrom: "Сегодня, 14:00", validUntil: "Сегодня, 16:00", status: "active" },
      ],
      residentVehicles: [
        { id: "vehicle-1", plate: "777 ABC 02", label: "Белая Toyota" },
      ],

      markNotificationRead: async (notificationId) => {
        if (isSupabaseConfigured()) {
          const { error } = await (createClient() as any).from("notifications").update({ is_read: true }).eq("id", notificationId);
          if (error) throw error;
        }
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification
          ),
        }));
      },

      clearBackendError: () => set({ backendError: null }),

      hydrateDomainData: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const data = await hydrateDomainData();
          if (!data) return;
          set({
            posts: data.posts,
            chats: data.chats,
            messages: data.messages,
            classifieds: data.classifieds,
            verificationRequests: data.verificationRequests,
            postComments: data.postComments,
            notifications: data.notifications,
            serviceRequests: data.serviceRequests,
            documents: data.documents,
            officialVotes: data.officialVotes,
            finance: data.finance,
            urgentAlert: data.urgentAlert,
            scheduleItems: data.scheduleItems,
            amenityResources: data.amenityResources,
            amenityBookings: data.amenityBookings,
            visitorPasses: data.visitorPasses,
            residentVehicles: data.residentVehicles,
            backendError: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось загрузить данные";
          set({ backendError: message });
          throw error;
        }
      },

      syncAuthState: async () => {
        if (!isSupabaseConfigured()) {
          set({ isAuthLoading: false });
          return;
        }

        const supabase = createClient();
        set({ isAuthLoading: true });

        try {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;

          if (!data.user) {
            set({ isLoggedIn: false, supabaseUserId: null, isAuthLoading: false });
            return;
          }

          if (!data.user.email_confirmed_at) {
            await supabase.auth.signOut();
            set({ isLoggedIn: false, supabaseUserId: null, isAuthLoading: false });
            return;
          }

          const account = await loadAccount(data.user);
          set((state) => ({
            registeredUsers: mergeAccount(state.registeredUsers, account),
            currentUser: account,
            isLoggedIn: true,
            supabaseUserId: data.user!.id,
            isAuthLoading: false,
          }));
        } catch (error) {
          set({ isLoggedIn: false, supabaseUserId: null, isAuthLoading: false });
          throw error;
        }
      },

      registerUser: async (data) => {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email.trim().toLowerCase(),
            password: data.password,
            options: {
              emailRedirectTo: getAuthCallbackUrl(),
              data: {
                full_name: data.fullName,
                phone: data.phone,
                role: data.role || "resident",
                building_number: data.buildingNumber,
                entrance_number: data.entranceNumber,
                apartment_number: data.apartmentNumber,
              },
            },
          });

          if (error) throw error;
          if (!authData.user) throw new Error("Supabase не вернул созданного пользователя");

          const account = authData.session && authData.user.email_confirmed_at
            ? await loadAccount(authData.user)
            : accountFromAuthMetadata(authData.user);
          const requiresEmailConfirmation = !authData.session || !authData.user.email_confirmed_at;
          if (requiresEmailConfirmation && authData.session) {
            await supabase.auth.signOut();
          }

          set((current) => ({
            registeredUsers: mergeAccount(current.registeredUsers, account),
            currentUser: account,
            isLoggedIn: !requiresEmailConfirmation,
            supabaseUserId: requiresEmailConfirmation ? null : authData.user!.id,
          }));

          return { account, requiresEmailConfirmation };
        }

        throw new Error("Supabase не настроен. Укажите переменные окружения для реальной регистрации.");
      },

      loginUser: async (email, password) => {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (error) throw error;
          if (!data.user) throw new Error("Supabase не вернул пользователя");
          if (!data.user.email_confirmed_at) {
            await supabase.auth.signOut();
            throw new Error("Подтвердите email по ссылке из письма, затем войдите снова");
          }

          const account = await loadAccount(data.user);
          set((current) => ({
            registeredUsers: mergeAccount(current.registeredUsers, account),
            currentUser: account,
            isLoggedIn: true,
            supabaseUserId: data.user!.id,
          }));
          return account;
        }

        throw new Error("Supabase не настроен. Укажите переменные окружения для реального входа.");
      },

      resetPassword: async (email) => {
        if (!isSupabaseConfigured()) throw new Error("Восстановление доступно только для реального аккаунта");
        const { error } = await createClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${getAuthCallbackUrl()}?next=/reset-password`,
        });
        if (error) throw error;
      },

      logoutUser: async () => {
        if (isSupabaseConfigured()) {
          const { error } = await createClient().auth.signOut();
          if (error) throw error;
        }

        set({
          currentUser: DEFAULT_ACCOUNTS[0],
          isLoggedIn: false,
          supabaseUserId: null,
        });
      },

      setVerified: (verified) =>
        set((state) => ({
          currentUser: { ...state.currentUser, verified },
        })),

      updateUser: (data) =>
        set((state) => {
          void persistProfileUpdate(data).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось сохранить профиль" });
          });
          return {
            currentUser: { ...state.currentUser, ...data },
            registeredUsers: state.registeredUsers.map((u) =>
              u.id === state.currentUser.id ? { ...u, ...data } : u
            ),
          };
        }),

      urgentAlert: {
        id: "alert-1",
        title: "Плановое отключение холодной воды",
        message: "Завтра с 10:00 до 14:00 в Доме 1 и Доме 2 в связи с заменой насосного оборудования.",
        affectedAreas: ["Дом 1", "Дом 2"],
        expectedResolution: "Завтра, 14:00",
        contactPhone: "+7 (727) 123-45-67",
        active: true,
        acknowledged: false,
        createdAt: "Сегодня в 09:00",
      },

      setUrgentAlert: async (alert) => {
        const remote = await persistEmergencyAlert(alert, get().urgentAlert?.id);
        set({ urgentAlert: remote || alert });
      },

      acknowledgeUrgentAlert: async () => {
        const alert = get().urgentAlert;
        if (!alert) return;
        await persistEmergencyAcknowledgement(alert.id);
        set({ urgentAlert: { ...alert, acknowledged: true } });
      },

      createServiceRequest: async (data, files = []) => {
        const state = get();
        const request = await persistServiceRequest(data, files);
        const now = new Date();
        const localRequest: ServiceRequestItem = request || {
          id: `service-request-${Date.now()}`,
          userId: state.currentUser.id,
          complexId: state.currentUser.complexId || "complex-1",
          ...data,
          status: "submitted",
          attachments: files.map((file, index) => ({
            id: `local-attachment-${Date.now()}-${index}`,
            url: URL.createObjectURL(file),
            name: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            kind: "evidence",
          })),
          events: [{
            id: `local-event-${Date.now()}`,
            kind: "created",
            actorName: state.currentUser.fullName,
            actorRole: state.currentUser.role,
            message: data.description,
            createdAt: now.toLocaleString("ru-RU"),
          }],
          createdAt: now.toLocaleString("ru-RU"),
          updatedAt: now.toLocaleString("ru-RU"),
        };
        set((current) => ({
          serviceRequests: [localRequest, ...current.serviceRequests],
          backendError: null,
        }));
      },

      addServiceRequestComment: async (requestId, message) => {
        const text = message.trim();
        if (!text) return;
        await persistServiceRequestComment(requestId, text);
        const state = get();
        const now = new Date().toLocaleString("ru-RU");
        set((current) => ({
          serviceRequests: current.serviceRequests.map((request) => request.id === requestId ? {
            ...request,
            updatedAt: now,
            events: [...request.events, {
              id: `local-event-${Date.now()}`,
              kind: "comment",
              actorName: state.currentUser.fullName,
              actorRole: state.currentUser.role,
              message: text,
              createdAt: now,
            }],
          } : request),
        }));
      },

      rateServiceRequest: async (requestId, rating) => {
        await persistServiceRequestRating(requestId, rating);
        const state = get();
        const now = new Date().toLocaleString("ru-RU");
        set((current) => ({
          serviceRequests: current.serviceRequests.map((request) => request.id === requestId ? {
            ...request,
            status: "closed",
            rating,
            updatedAt: now,
            events: [...request.events, {
              id: `local-event-${Date.now()}`,
              kind: "rated",
              actorName: state.currentUser.fullName,
              actorRole: state.currentUser.role,
              message: `Оценка: ${rating} из 5`,
              createdAt: now,
            }],
          } : request),
        }));
      },

      reopenServiceRequest: async (requestId, message) => {
        await persistServiceRequestReopen(requestId, message);
        const state = get();
        const now = new Date().toLocaleString("ru-RU");
        set((current) => ({
          serviceRequests: current.serviceRequests.map((request) => request.id === requestId ? {
            ...request,
            status: "submitted",
            rating: undefined,
            updatedAt: now,
            events: [...request.events, {
              id: `local-event-${Date.now()}`,
              kind: "reopened",
              actorName: state.currentUser.fullName,
              actorRole: state.currentUser.role,
              message: message.trim() || "Требуется дополнительная работа",
              createdAt: now,
            }],
          } : request),
        }));
      },

      updateServiceRequestStatus: async (requestId, status, options = {}) => {
        await persistServiceRequestStatus(requestId, status, options.note, options.assigneeName, options.slaDueAt);
        const state = get();
        const now = new Date().toLocaleString("ru-RU");
        set((current) => ({
          serviceRequests: current.serviceRequests.map((request) => request.id === requestId ? {
            ...request,
            status,
            assigneeName: options.assigneeName || request.assigneeName,
            slaDueAt: options.slaDueAt || request.slaDueAt,
            resolutionNote: status === "resolved" ? options.note || request.resolutionNote : request.resolutionNote,
            updatedAt: now,
            events: [...request.events, {
              id: `local-event-${Date.now()}`,
              kind: status === "resolved" ? "resolution" : "status_changed",
              actorName: state.currentUser.fullName,
              actorRole: state.currentUser.role,
              message: options.note,
              createdAt: now,
            }],
          } : request),
        }));
      },

      addHouseDocument: async (data, file) => {
        const state = get();
        const remote = await persistHouseDocument(data, file);
        const document: HouseDocument = remote || {
          id: `document-${Date.now()}`,
          complexId: state.currentUser.complexId || "complex-1",
          ...data,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          url: URL.createObjectURL(file),
          acknowledged: false,
          status: "active",
          publishedBy: state.currentUser.fullName,
          publishedAt: new Date().toLocaleString("ru-RU"),
        };
        set((current) => ({ documents: [document, ...current.documents] }));
      },

      acknowledgeDocument: async (documentId) => {
        await persistDocumentAcknowledgement(documentId);
        set((state) => ({
          documents: state.documents.map((document) => document.id === documentId ? { ...document, acknowledged: true } : document),
        }));
      },

      archiveDocument: async (documentId) => {
        await persistDocumentArchive(documentId);
        set((state) => ({
          documents: state.documents.map((document) => document.id === documentId ? { ...document, status: "archived" } : document),
        }));
      },

      castOfficialVote: async (voteId, choice) => {
        const remoteBallot = await persistOfficialVoteChoice(voteId, choice);
        set((state) => ({
          officialVotes: state.officialVotes.map((vote) => {
            if (vote.id !== voteId || vote.userChoice) return vote;
            const fallbackWeight = vote.basis === "area"
              ? vote.eligibleWeight / Math.max(1, vote.eligibleUnits)
              : 1;
            const ballotWeight = Number(remoteBallot?.weight || fallbackWeight);
            const eligibleWeight = vote.basis === "area" ? vote.eligibleWeight : vote.eligibleUnits;
            return {
              ...vote,
              userChoice: choice,
              participationPercent: Math.min(100, vote.participationPercent + ((ballotWeight / Math.max(1, eligibleWeight)) * 100)),
              results: { ...vote.results, [choice]: vote.results[choice] + ballotWeight },
            };
          }),
        }));
      },

      addFinanceTransaction: async (data) => {
        const remote = await recordFinanceTransaction(data);
        const transaction: FinanceTransaction = remote || { ...data, id: `finance-${Date.now()}` };
        set((state) => ({
          finance: {
            ...state.finance,
            balance: state.finance.balance + (transaction.direction === "income" ? transaction.amount : -transaction.amount),
            income: state.finance.income + (transaction.direction === "income" ? transaction.amount : 0),
            expense: state.finance.expense + (transaction.direction === "expense" ? transaction.amount : 0),
            transactions: [transaction, ...state.finance.transactions],
          },
        }));
      },

      createAmenityBooking: async (resourceId, startsAt, endsAt) => {
        const remote = await persistAmenityBooking(resourceId, startsAt, endsAt);
        const booking: AmenityBooking = remote || { id: `booking-${Date.now()}`, resourceId, startsAt, endsAt, status: "confirmed" };
        set((state) => ({ amenityBookings: [booking, ...state.amenityBookings] }));
      },

      createVisitorPass: async (data) => {
        const remote = await persistVisitorPass(data);
        const now = new Date().toLocaleString("ru-RU");
        const pass: VisitorPass = remote || {
          id: `pass-${Date.now()}`,
          ...data,
          accessCode: crypto.randomUUID().slice(0, 8).toUpperCase(),
          validFrom: now,
          status: "active",
        };
        set((state) => ({ visitorPasses: [pass, ...state.visitorPasses] }));
      },

      addResidentVehicle: async (plate, label) => {
        const remote = await persistResidentVehicle(plate, label);
        const vehicle: ResidentVehicle = remote || { id: `vehicle-${Date.now()}`, plate, label };
        set((state) => ({ residentVehicles: [vehicle, ...state.residentVehicles] }));
      },

      markAllNotificationsRead: async () => {
        if (isSupabaseConfigured()) {
          const { error } = await (createClient() as any)
            .from("notifications")
            .update({ is_read: true })
            .eq("is_read", false);
          if (error) throw error;
        }
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
        }));
      },

      verificationRequests: [
        {
          id: "req-1",
          userId: "user-101",
          fullName: "Бауыржан Сапаров",
          phone: "+7 (701) 987-65-43",
          buildingNumber: "1",
          entranceNumber: 2,
          apartmentNumber: "28",
          documentType: "Договор купли-продажи / eGov",
          documentUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80",
          status: "pending",
          submittedAt: "25 минут назад",
        },
      ],

      approveVerification: (requestId) =>
        set((state) => {
          const previousRequests = state.verificationRequests;
          const previousUsers = state.registeredUsers;
          const previousCurrentUser = state.currentUser;
          void reviewVerificationRequest(requestId, true).catch((error) => {
            set({
              verificationRequests: previousRequests,
              registeredUsers: previousUsers,
              currentUser: previousCurrentUser,
              backendError: error instanceof Error ? error.message : "Не удалось подтвердить жителя",
            });
          });
          const req = state.verificationRequests.find((r) => r.id === requestId);
          const updatedRequests = state.verificationRequests.map((r) =>
            r.id === requestId ? { ...r, status: "approved" as const } : r
          );
          const updatedUsers = state.registeredUsers.map((u) =>
            req && u.id === req.userId ? { ...u, verified: true } : u
          );
          const updatedCurrent =
            req && state.currentUser.id === req.userId
              ? { ...state.currentUser, verified: true }
              : state.currentUser;

          return {
            verificationRequests: updatedRequests,
            registeredUsers: updatedUsers,
            currentUser: updatedCurrent,
          };
        }),

      rejectVerification: (requestId) =>
        set((state) => {
          const previousRequests = state.verificationRequests;
          void reviewVerificationRequest(requestId, false).catch((error) => {
            set({
              verificationRequests: previousRequests,
              backendError: error instanceof Error ? error.message : "Не удалось отклонить заявку",
            });
          });
          return {
            verificationRequests: state.verificationRequests.map((r) =>
              r.id === requestId ? { ...r, status: "rejected" as const } : r
            ),
          };
        }),

      posts: [
        {
          id: "post-1",
          author_id: "user-1",
          complex_id: "complex-1",
          building_id: "building-2",
          entrance_id: null,
          type: "post",
          title: null,
          content: "Соседи, добрый день!\nКто подскажет, когда будут проводиться работы по благоустройству во дворе?",
          status: "active",
          is_official: false,
          territory: "complex",
          price: null,
          currency: null,
          views_count: 142,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          author: {
            id: "user-1",
            full_name: "Мария Иванова",
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            role: "resident",
            verified: true,
          },
          attachments: [
            {
              id: "att-1",
              post_id: "post-1",
              url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
              type: "image",
              name: "dvor.jpg",
              size: 1024000,
              created_at: new Date().toISOString(),
            },
          ],
          reactions_count: 12,
          comments_count: 2,
        },
        {
          id: "post-2",
          author_id: "user-hoa",
          complex_id: "complex-1",
          building_id: null,
          entrance_id: null,
          type: "official_poll",
          title: "Какой проект благоустройства двора вам больше нравится?",
          content: "Голосование до 25 мая. Просим каждого жителя отдать свой голос за лучший проект детской и прогулочной зоны.",
          status: "active",
          is_official: true,
          territory: "complex",
          price: null,
          currency: null,
          views_count: 320,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          author: {
            id: "user-hoa",
            full_name: "ОСИ «Солнечный»",
            avatar_url: null,
            role: "hoa_official",
            verified: true,
          },
          poll: {
            id: "poll-1",
            post_id: "post-2",
            is_multiple: false,
            ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            total_votes: 68,
            options: [
              { id: "opt-1", poll_id: "poll-1", text: "Проект А: Новая эко-площадка и беседки", votes_count: 42, position: 0 },
              { id: "opt-2", poll_id: "poll-1", text: "Проект Б: Спортивный воркаут и тренажеры", votes_count: 18, position: 1 },
              { id: "opt-3", poll_id: "poll-1", text: "Проект В: Дополнительное озеленение и аллея", votes_count: 8, position: 2 },
            ],
          },
          reactions_count: 24,
          comments_count: 4,
        },
        {
          id: "post-3",
          author_id: "user-2",
          complex_id: "complex-1",
          building_id: "building-1",
          entrance_id: "entrance-2",
          type: "initiative",
          title: "Установка камеры видеонаблюдения в подъезде 2",
          content: "Предлагаю установить камеру видеонаблюдения в подъезде 2 для безопасности колясок, велосипедов и общего контроля доступа.",
          status: "active",
          is_official: false,
          territory: "entrance",
          price: null,
          currency: null,
          views_count: 89,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          author: {
            id: "user-2",
            full_name: "Алексей Петров",
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
            role: "resident",
            verified: true,
          },
          initiative: {
            id: "init-1",
            post_id: "post-3",
            stage: "hoa_review",
            goal: "Безопасность и сохранность имущества жителей подъезда 2",
            supporters: 24,
            updated_at: new Date().toISOString(),
          },
          reactions_count: 19,
          comments_count: 6,
        },
        {
          id: "post-4",
          author_id: "user-hoa",
          complex_id: "complex-1",
          building_id: null,
          entrance_id: null,
          type: "fundraiser",
          title: "Сбор на благоустройство двора",
          content: "Собираем средства на обустройство безопасного покрытия детской площадки и установку парковых фонарей.",
          status: "active",
          is_official: true,
          territory: "complex",
          price: null,
          currency: null,
          views_count: 512,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          author: {
            id: "user-hoa",
            full_name: "ОСИ «Солнечный»",
            avatar_url: null,
            role: "hoa_official",
            verified: true,
          },
          fundraiser: {
            id: "fund-1",
            post_id: "post-4",
            initiative_id: null,
            target_amount: 2000000,
            current_amount: 1250000,
            currency: "₸",
            payment_url: "https://pay.kaspi.kz",
            qr_url: null,
            ends_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          reactions_count: 45,
          comments_count: 3,
        },
      ],

      postComments: {
        "post-1": [
          {
            id: "c-1",
            authorName: "Алексей Петров",
            isOfficial: false,
            text: "Вчера видел рабочих во дворе, вроде начали разметку под площадку делать.",
            time: "1 час назад",
          },
          {
            id: "c-2",
            authorName: "ОСИ «Солнечный»",
            isOfficial: true,
            text: "Добрый день! Основной этап работ начнется в понедельник. Подробный график опубликуем в разделе «Мой ЖК».",
            time: "45 минут назад",
          },
        ],
      },

      addPost: (post) =>
        set((state) => {
          const savedPost = isSupabaseConfigured() && !isUuid(post.id)
            ? { ...post, id: crypto.randomUUID() }
            : post;
          const previousPosts = state.posts;
          void persistPost(savedPost).catch((error) => {
            set({
              posts: previousPosts,
              backendError: error instanceof Error ? error.message : "Не удалось сохранить публикацию",
            });
          });
          return { posts: [savedPost, ...state.posts], backendError: null };
        }),

      deletePost: (postId) =>
        set((state) => {
          void deletePostRemote(postId).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось удалить публикацию" });
          });
          return { posts: state.posts.filter((post) => post.id !== postId) };
        }),

      likePost: (postId) =>
        set((state) => {
          const previousPosts = state.posts;
          void persistReaction(postId).catch((error) => {
            set({
              posts: previousPosts,
              backendError: error instanceof Error ? error.message : "Не удалось сохранить реакцию",
            });
          });
          return {
            posts: state.posts.map((p) =>
              p.id === postId
                ? { ...p, reactions_count: (p.reactions_count || 0) + 1 }
                : p
            ),
          };
        }),

      unlikePost: (postId) =>
        set((state) => {
          const previousPosts = state.posts;
          void removeReaction(postId).catch((error) => {
            set({
              posts: previousPosts,
              backendError: error instanceof Error ? error.message : "Не удалось убрать реакцию",
            });
          });
          return {
            posts: state.posts.map((p) =>
              p.id === postId
                ? { ...p, reactions_count: Math.max(0, (p.reactions_count || 0) - 1) }
                : p
            ),
          };
        }),

      votePoll: (postId, optionId) =>
        set((state) => {
          const previousPosts = state.posts;
          void persistPollVote(postId, optionId).catch((error) => {
            set({
              posts: previousPosts,
              backendError: error instanceof Error ? error.message : "Не удалось сохранить голос",
            });
          });
          return {
          posts: state.posts.map((p) => {
            if (p.id !== postId || !p.poll) return p;
            return {
              ...p,
              poll: {
                ...p.poll,
                total_votes: p.poll.total_votes + 1,
                options: p.poll.options.map((opt) =>
                  opt.id === optionId
                    ? { ...opt, votes_count: opt.votes_count + 1 }
                    : opt
                ),
              },
            };
          }),
          };
        }),

      supportInitiative: (initiativeId) =>
        set((state) => {
          void persistInitiativeSupport(initiativeId).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось сохранить поддержку" });
          });
          return {
          posts: state.posts.map((p) => {
            if (p.initiative?.id !== initiativeId) return p;
            return {
              ...p,
              initiative: {
                ...p.initiative,
                supporters: (p.initiative.supporters || 0) + 1,
              },
            };
          }),
          };
        }),

      addComment: (postId, commentText) =>
        set((state) => {
          const currentList = state.postComments[postId] || [];
          const commentId = isSupabaseConfigured() ? crypto.randomUUID() : `c-${Date.now()}`;
          void persistComment(postId, commentText).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось сохранить комментарий" });
          });
          const newComment = {
            id: commentId,
            authorName: state.currentUser.fullName,
            isOfficial: state.currentUser.role === "hoa_official",
            text: commentText,
            time: "Только что",
          };

          return {
            postComments: {
              ...state.postComments,
              [postId]: [...currentList, newComment],
            },
            posts: state.posts.map((p) =>
              p.id === postId
                ? { ...p, comments_count: (p.comments_count || 0) + 1 }
                : p
            ),
          };
        }),

      deleteComment: (postId, commentId) =>
        set((state) => {
          void deleteCommentRemote(commentId).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось удалить комментарий" });
          });
          return {
            postComments: {
              ...state.postComments,
              [postId]: (state.postComments[postId] || []).filter((comment) => comment.id !== commentId),
            },
          };
        }),

      chats: [
        {
          id: "1",
          name: "Чат дома 1",
          type: "building",
          lastMessage: "Алексей: Добрый вечер! Лифт починили?",
          lastMessageTime: "19:45",
          unreadCount: 3,
          avatarColor: "bg-blue-600",
          icon: "🏢",
        },
        {
          id: "2",
          name: "Чат подъезда 1",
          type: "entrance",
          lastMessage: "Ирина: Спасибо за контакты сантехника!",
          lastMessageTime: "18:30",
          unreadCount: 0,
          avatarColor: "bg-emerald-600",
          icon: "🚪",
        },
        {
          id: "3",
          name: "Благоустройство двора",
          type: "thematic",
          lastMessage: "Олег: Прикрепил файл сметы",
          lastMessageTime: "16:12",
          unreadCount: 5,
          avatarColor: "bg-amber-600",
          icon: "🌳",
        },
        {
          id: "4",
          name: "Родители ЖК",
          type: "thematic",
          lastMessage: "Анна: Кто идёт на детскую площадку?",
          lastMessageTime: "15:45",
          unreadCount: 0,
          avatarColor: "bg-rose-500",
          icon: "🧸",
        },
        {
          id: "5",
          name: "Личные: Олег Смирнов",
          type: "direct",
          lastMessage: "Олег: Добрый день, могу подойти к 18:00",
          lastMessageTime: "14:20",
          unreadCount: 1,
          avatarColor: "bg-purple-600",
          icon: "⚡",
        },
      ],

      messages: {
        "1": [
          {
            id: "m1",
            chatId: "1",
            senderId: "user-2",
            senderName: "Алексей Петров",
            isMe: false,
            text: "Добрый вечер, соседи! Кто в курсе, когда закончат работы в лифте?",
            time: "19:30",
          },
          {
            id: "m2",
            chatId: "1",
            senderId: "user-hoa",
            senderName: "ОСИ «Солнечный»",
            isOfficial: true,
            isMe: false,
            text: "Здравствуйте! Специалисты завершают диагностику, запустят к 20:00.",
            time: "19:35",
          },
          {
            id: "m3",
            chatId: "1",
            senderId: "user-1",
            senderName: "Мария Иванова",
            isMe: true,
            text: "Спасибо большое за оперативность!",
            time: "19:40",
          },
          {
            id: "m4",
            chatId: "1",
            senderId: "user-2",
            senderName: "Алексей Петров",
            isMe: false,
            text: "Отлично, ждём!",
            time: "19:45",
          },
        ],
        "5": [
          {
            id: "m5-1",
            chatId: "5",
            senderId: "user-1",
            senderName: "Мария Иванова",
            isMe: true,
            text: "Олег, здравствуйте! Нужна замена автомата в щитке в кв. 45.",
            time: "14:10",
          },
          {
            id: "m5-2",
            chatId: "5",
            senderId: "user-master",
            senderName: "Олег Смирнов",
            isMe: false,
            text: "Добрый день! Да, без проблем. Буду свободен после 18:00, могу подойти к 18:30.",
            time: "14:20",
          },
        ],
      },

      sendMessage: (chatId, text) =>
        set((state) => {
          const previousMessages = state.messages;
          const previousChats = state.chats;
          const currentMsgs = state.messages[chatId] || [];
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const newMsg: MessageItem = {
            id: isSupabaseConfigured() ? crypto.randomUUID() : `msg-${Date.now()}`,
            chatId,
            senderId: state.currentUser.id,
            senderName: state.currentUser.fullName,
            isMe: true,
            text,
            time: timeStr,
          };

          void persistMessage(chatId, text).catch((error) => {
            set({
              messages: previousMessages,
              chats: previousChats,
              backendError: error instanceof Error ? error.message : "Не удалось отправить сообщение",
            });
          });

          return {
            messages: {
              ...state.messages,
              [chatId]: [...currentMsgs, newMsg],
            },
            chats: state.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    lastMessage: `Вы: ${text}`,
                    lastMessageTime: timeStr,
                  }
                : c
            ),
          };
        }),

      deleteMessage: (chatId, messageId) =>
        set((state) => {
          void deleteMessageRemote(messageId).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось удалить сообщение" });
          });
          return {
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] || []).map((message) =>
                message.id === messageId ? { ...message, text: "Сообщение удалено" } : message
              ),
            },
          };
        }),

      createDirectChatWith: async (authorId, authorName) => {
        const state = get();
        if (isSupabaseConfigured()) {
          const chatId = await createDirectChatRemote(authorId);
          await get().hydrateDomainData();
          return chatId;
        }

        const existingChat = state.chats.find((c) => c.name.includes(authorName));
        if (existingChat) return existingChat.id;

        const newChatId = `chat-${Date.now()}`;
        const newChat: ChatItem = {
          id: newChatId,
          name: `Личные: ${authorName}`,
          type: "direct",
          lastMessage: "Чат начат",
          lastMessageTime: "Только что",
          unreadCount: 0,
          avatarColor: "bg-green-600",
          icon: "💬",
        };

        set({
          chats: [newChat, ...state.chats],
          messages: {
            ...state.messages,
            [newChatId]: [
              {
                id: `msg-welcome-${Date.now()}`,
                chatId: newChatId,
                senderId: state.currentUser.id,
                senderName: state.currentUser.fullName,
                isMe: true,
                text: `Здравствуйте, ${authorName}! Пишу по вашему объявлению.`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ],
          },
        });

        return newChatId;
      },

      classifieds: [
        {
          id: "item-1",
          title: "Продам удобный диван",
          category: "Объявления",
          price: "5 000 ₸",
          location: "Дом 2, кв. 45 • 3 минуты назад",
          image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
          description: "Раскладной двухместный диван в отличном состоянии. Самовывоз из Дома 2 (есть грузовой лифт).",
          authorId: "user-1",
          authorName: "Мария Иванова",
          authorPhone: "+7 (777) 234-56-78",
          createdAt: "3 минуты назад",
        },
        {
          id: "item-2",
          title: "Услуги электрика: монтаж и замена щитков",
          category: "Услуги",
          price: "от 500 ₸",
          location: "Дом 1, кв. 3 • 25 минут назад",
          image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
          description: "Профессиональный электрик с допуском. Замена автоматов, розеток, люстр, устранение коротких замыканий.",
          authorId: "user-master",
          authorName: "Олег Смирнов (Мастер)",
          authorPhone: "+7 (775) 123-99-88",
          createdAt: "25 минут назад",
        },
        {
          id: "item-3",
          title: "Няня для ребёнка на несколько часов",
          category: "Подработки",
          price: "Договорная",
          location: "Дом 1, кв. 18 • 1 час назад",
          image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80",
          description: "Педагогическое образование, опыт с детьми 3-7 лет. Могу погулять на площадке или посидеть дома.",
          authorId: "user-anna",
          authorName: "Анна Сергеева",
          authorPhone: "+7 (702) 111-22-33",
          createdAt: "1 час назад",
        },
        {
          id: "item-4",
          title: "Помогу с генеральной уборкой",
          category: "Помощь",
          price: "Договорная",
          location: "Подъезд 2 • 2 часа назад",
          image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
          description: "Качественная эко-уборка квартир после ремонта и генеральная уборка. Свои средства.",
          authorId: "user-elena",
          authorName: "Елена Смирнова",
          authorPhone: "+7 (777) 555-11-22",
          createdAt: "2 часа назад",
        },
      ],

      addClassified: (item) =>
        set((state) => {
          void persistClassified({
            title: item.title,
            category: item.category,
            description: item.description,
            location: item.location,
            imagePath: item.image,
          }).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось сохранить объявление" });
          });
          return { classifieds: [item, ...state.classifieds] };
        }),

      deleteClassified: (itemId) =>
        set((state) => {
          void deleteClassifiedRemote(itemId).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось удалить объявление" });
          });
          return { classifieds: state.classifieds.filter((item) => item.id !== itemId) };
        }),

      donateToFundraiser: async (fundraiserId, amount) => {
        await recordFundraiserPayment(fundraiserId, amount);
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.fundraiser?.id !== fundraiserId) return p;
            return {
              ...p,
              fundraiser: {
                ...p.fundraiser,
                current_amount: p.fundraiser.current_amount + amount,
              },
            };
          }),
        }));
      },

      createFundraiser: (data) =>
        set((state) => {
          if (isSupabaseConfigured() && !["hoa_official", "admin"].includes(state.currentUser.role)) {
            return { backendError: "Только представитель ОСИ может запускать сборы" };
          }
          const newPostId = isSupabaseConfigured() ? crypto.randomUUID() : `post-fund-${Date.now()}`;
          const newPost: PostWithAuthor = {
            id: newPostId,
            author_id: state.currentUser.id,
            complex_id: "complex-1",
            building_id: null,
            entrance_id: null,
            type: "fundraiser",
            title: data.title,
            content: data.content,
            status: "active",
            is_official: true,
            territory: "complex",
            price: null,
            currency: null,
            views_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            author: {
              id: state.currentUser.id,
              full_name: "ОСИ «Солнечный»",
              avatar_url: null,
              role: "hoa_official",
              verified: true,
            },
            fundraiser: {
              id: isSupabaseConfigured() ? crypto.randomUUID() : `fund-${Date.now()}`,
              post_id: newPostId,
              initiative_id: null,
              target_amount: data.targetAmount,
              current_amount: 0,
              currency: data.currency || "₸",
              payment_url: "https://pay.kaspi.kz",
              qr_url: null,
              ends_at: data.endsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            reactions_count: 0,
            comments_count: 0,
          };

          void persistFundraiser(newPost, newPost.fundraiser!).catch((error) => {
            set({ backendError: error instanceof Error ? error.message : "Не удалось сохранить сбор" });
          });

          return {
            posts: [newPost, ...state.posts],
          };
        }),

      submitVerificationRequest: async (data) => {
        await submitVerificationRequestRemote(data);
      },
    }),
    {
      name: "housesm-store-v4",
      partialize: (state) => ({
        currentUser: state.currentUser,
        registeredUsers: state.registeredUsers,
        posts: state.posts,
        chats: state.chats,
        messages: state.messages,
        classifieds: state.classifieds,
        postComments: state.postComments,
        verificationRequests: state.verificationRequests,
        serviceRequests: state.serviceRequests,
        documents: state.documents,
        officialVotes: state.officialVotes,
        finance: state.finance,
        scheduleItems: state.scheduleItems,
        amenityResources: state.amenityResources,
        amenityBookings: state.amenityBookings,
        visitorPasses: state.visitorPasses,
        residentVehicles: state.residentVehicles,
        urgentAlert: state.urgentAlert,
        notificationPreferences: state.notificationPreferences,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AppState>),
        isLoggedIn: !isSupabaseConfigured(),
        isAuthLoading: isSupabaseConfigured(),
        supabaseUserId: null,
      }),
    }
  )
);
