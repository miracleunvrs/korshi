import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PostWithAuthor } from "@/types";
import type { AppNotification, ChatItem, MessageItem, UserAccount, VerificationRequest } from "@/stores/appStore";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const configured = () => isSupabaseConfigured();
const isUuid = (value: string | null | undefined) => Boolean(value && UUID_RE.test(value));

async function currentUserId() {
  const { data, error } = await (createClient() as any).auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Требуется авторизация");
  return data.user.id as string;
}

async function profileContext() {
  const supabase = createClient() as any;
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, complex_id, apartment_id, verified")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return { supabase, userId, profile: data as any };
}

export async function persistPost(post: PostWithAuthor) {
  if (!configured()) return post.id;
  const { supabase, userId, profile } = await profileContext();
  if (!profile.complex_id) throw new Error("Профиль ещё не привязан к ЖК");
  if (!profile.verified) {
    throw new Error("Публикации доступны только подтверждённым жителям. Сначала подтвердите статус жителя.");
  }

  let buildingId = isUuid(post.building_id) ? post.building_id : null;
  let entranceId = isUuid(post.entrance_id) ? post.entrance_id : null;

  if (!buildingId && profile.apartment_id) {
    const { data: apartment } = await supabase
      .from("apartments")
      .select("entrance_id")
      .eq("id", profile.apartment_id)
      .maybeSingle();
    entranceId = entranceId || apartment?.entrance_id || null;
    if (entranceId) {
      const { data: entrance } = await supabase
        .from("entrances")
        .select("building_id")
        .eq("id", entranceId)
        .maybeSingle();
      buildingId = entrance?.building_id || null;
    }
  }

  const postId = isUuid(post.id) ? post.id : crypto.randomUUID();
  const { error } = await supabase.from("posts").insert({
    id: postId,
    author_id: userId,
    complex_id: profile.complex_id,
    building_id: buildingId,
    entrance_id: entranceId,
    type: post.type,
    title: post.title,
    content: post.content,
    status: post.status,
    is_official: post.is_official,
    territory: post.territory,
    price: post.price,
    currency: post.currency || "KZT",
  });
  if (error) throw error;

  if (post.attachments?.length) {
    const attachments = post.attachments
      .filter((attachment) => attachment.url)
      .map((attachment) => ({
        post_id: postId,
        url: attachment.url,
        type: attachment.type,
        name: attachment.name,
        size: attachment.size,
      }));
    if (attachments.length) {
      const result = await supabase.from("post_attachments").insert(attachments);
      if (result.error) throw result.error;
    }
  }

  if (post.poll) {
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        post_id: postId,
        is_multiple: post.poll.is_multiple,
        ends_at: post.poll.ends_at,
      })
      .select("id")
      .single();
    if (pollError) throw pollError;
    const options = post.poll.options.map((option, position) => ({
      poll_id: poll.id,
      text: option.text,
      position,
    }));
    if (options.length) {
      const result = await supabase.from("poll_options").insert(options);
      if (result.error) throw result.error;
    }
  }

  if (post.initiative) {
    const result = await supabase.from("initiatives").insert({
      post_id: postId,
      stage: post.initiative.stage,
      goal: post.initiative.goal,
    });
    if (result.error) throw result.error;
  }

  return postId;
}

export async function deletePost(postId: string) {
  if (!configured() || !isUuid(postId)) return;
  const { error } = await (createClient() as any).from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function persistFundraiser(post: PostWithAuthor, fundraiser: NonNullable<PostWithAuthor["fundraiser"]>) {
  const postId = await persistPost(post);
  if (!configured()) return postId;
  const { error } = await (createClient() as any).from("fundraisers").insert({
    id: isUuid(fundraiser.id) ? fundraiser.id : crypto.randomUUID(),
    post_id: postId,
    initiative_id: isUuid(fundraiser.initiative_id) ? fundraiser.initiative_id : null,
    target_amount: fundraiser.target_amount,
    currency: fundraiser.currency === "₸" ? "KZT" : fundraiser.currency,
    payment_url: fundraiser.payment_url,
    qr_url: fundraiser.qr_url,
    ends_at: fundraiser.ends_at,
    status: fundraiser.status,
  });
  if (error) throw error;
  return postId;
}

export async function persistComment(postId: string, content: string) {
  if (!configured() || !isUuid(postId)) return;
  const { supabase, userId } = await profileContext();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: userId,
    content,
  });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  if (!configured() || !isUuid(commentId)) return;
  const { error } = await (createClient() as any).from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function persistReaction(postId: string, type: "like" | "support" | "thanks" = "like") {
  if (!configured() || !isUuid(postId)) return;
  const { supabase, userId } = await profileContext();
  const { error } = await supabase
    .from("reactions")
    .upsert({ post_id: postId, user_id: userId, type }, { onConflict: "post_id,user_id" });
  if (error) throw error;
}

export async function removeReaction(postId: string) {
  if (!configured() || !isUuid(postId)) return;
  const { supabase, userId } = await profileContext();
  const { error } = await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

export async function persistPollVote(postId: string, optionId: string) {
  if (!configured() || !isUuid(postId) || !isUuid(optionId)) return;
  const { supabase, userId } = await profileContext();
  const { data: poll, error: pollError } = await supabase.from("polls").select("id").eq("post_id", postId).single();
  if (pollError) throw pollError;
  const { error } = await supabase.from("poll_votes").insert({
    poll_id: poll.id,
    option_id: optionId,
    user_id: userId,
  });
  if (error) throw error;
}

export async function persistInitiativeSupport(initiativeId: string) {
  if (!configured() || !isUuid(initiativeId)) return;
  const { supabase, userId } = await profileContext();
  const { error } = await supabase.from("initiative_supports").insert({
    initiative_id: initiativeId,
    user_id: userId,
  });
  if (error && error.code !== "23505") throw error;
}

export async function persistMessage(chatId: string, content: string) {
  if (!configured()) return;
  if (!isUuid(chatId)) {
    throw new Error("Этот чат ещё не подключён к серверу. Обновите список чатов после применения миграций.");
  }
  const { supabase, userId } = await profileContext();
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    sender_id: userId,
    content,
    type: "text",
  });
  if (error) throw error;
}

export async function createDirectChat(targetUserId: string) {
  if (!configured() || !isUuid(targetUserId)) {
    throw new Error("Этот пользователь ещё не подключён к серверу");
  }
  const { data, error } = await (createClient() as any).rpc("create_direct_chat", {
    p_target_user: targetUserId,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteMessage(messageId: string) {
  if (!configured() || !isUuid(messageId)) return;
  const { error } = await (createClient() as any).from("messages").update({ is_deleted: true }).eq("id", messageId);
  if (error) throw error;
}

export async function persistProfileUpdate(data: Partial<UserAccount>) {
  if (!configured()) return;
  const { supabase, userId } = await profileContext();
  const update: Record<string, unknown> = {};
  if (data.fullName !== undefined) update.full_name = data.fullName;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl;
  if (data.bio !== undefined) update.bio = data.bio;
  if (Object.keys(update).length === 0) return;
  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) throw error;
}

export async function submitVerificationRequest(data: {
  fullName: string;
  phone: string;
  buildingNumber: string;
  entranceNumber: number;
  apartmentNumber: string;
  documentType: string;
  documentPath: string;
}) {
  if (!configured()) return;
  const { supabase, userId } = await profileContext();
  const { error } = await supabase.from("verification_requests").insert({
    user_id: userId,
    full_name: data.fullName,
    phone: data.phone || null,
    building_number: data.buildingNumber,
    entrance_number: data.entranceNumber,
    apartment_number: data.apartmentNumber,
    document_type: data.documentType,
    document_path: data.documentPath,
  });
  if (error) throw error;
}

export async function persistClassified(data: {
  title: string;
  category: string;
  price?: number | null;
  currency?: string;
  location?: string;
  imagePath?: string;
  description: string;
}) {
  if (!configured()) return;
  const { supabase, userId, profile } = await profileContext();
  if (!profile.complex_id) throw new Error("Профиль ещё не привязан к ЖК");
  const { error } = await supabase.from("classifieds").insert({
    author_id: userId,
    complex_id: profile.complex_id,
    title: data.title,
    category: data.category,
    price: data.price ?? null,
    currency: data.currency || "KZT",
    location: data.location || null,
    image_path: data.imagePath || null,
    description: data.description,
  });
  if (error) throw error;
}

export async function deleteClassified(id: string) {
  if (!configured() || !isUuid(id)) return;
  const { error } = await (createClient() as any).from("classifieds").delete().eq("id", id);
  if (error) throw error;
}

export async function reviewVerificationRequest(requestId: string, approved: boolean, reason?: string) {
  if (!configured() || !isUuid(requestId)) return;
  const { error } = await (createClient() as any).rpc("review_verification_request", {
    p_request_id: requestId,
    p_approved: approved,
    p_reason: reason || null,
  });
  if (error) throw error;
}

export async function recordFundraiserPayment(
  fundraiserId: string,
  amount: number,
  comment?: string,
  anonymous = false
) {
  if (!configured() || !isUuid(fundraiserId)) return;
  const { error } = await (createClient() as any).rpc("record_fundraiser_payment", {
    p_fundraiser_id: fundraiserId,
    p_amount: amount,
    p_comment: comment || null,
    p_is_anonymous: anonymous,
  });
  if (error) throw error;
}

function relation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null;
}

async function signedMediaUrl(supabase: any, path: string | null | undefined) {
  if (!path || /^https?:\/\//i.test(path)) return path || "";
  const { data, error } = await supabase.storage.from("house-media").createSignedUrl(path, 60 * 60);
  return error ? path : data?.signedUrl || path;
}

function mapPost(row: any): PostWithAuthor {
  const poll = relation(row.poll);
  const initiative = relation(row.initiative);
  const fundraiser = relation(row.fundraiser);
  return {
    ...row,
    author: relation(row.author) || {
      id: row.author_id,
      full_name: "Сосед",
      avatar_url: null,
      role: "resident",
      verified: false,
    },
    attachments: row.attachments || [],
    poll: poll ? { ...poll, options: poll.options || [] } : undefined,
    initiative: initiative || undefined,
    fundraiser: fundraiser || undefined,
  } as PostWithAuthor;
}

export async function hydrateDomainData() {
  if (!configured()) return null;
  const supabase = createClient() as any;
  const userId = await currentUserId();
  const [postsResult, chatsResult, classifiedsResult, notificationsResult] = await Promise.all([
    supabase.from("posts").select("*, author:profiles(id, full_name, avatar_url, role, verified), attachments:post_attachments(*), poll:polls(*, options:poll_options(*)), initiative:initiatives(*), fundraiser:fundraisers(*)").order("created_at", { ascending: false }).limit(50),
    supabase.from("chats").select("*").order("last_message_at", { ascending: false, nullsFirst: false }).limit(100),
    supabase.from("classifieds").select("*, author:profiles(id, full_name, phone)").order("created_at", { ascending: false }).limit(50),
    supabase.from("notifications").select("id, type, title, body, is_read, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  if (postsResult.error) throw postsResult.error;
  if (chatsResult.error) throw chatsResult.error;
  if (classifiedsResult.error) throw classifiedsResult.error;
  if (notificationsResult.error) throw notificationsResult.error;

  const chats: ChatItem[] = (chatsResult.data || []).map((chat: any) => ({
    id: chat.id,
    name: chat.name || "Чат сообщества",
    type: chat.type,
    lastMessage: "",
    lastMessageTime: chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    unreadCount: 0,
    avatarColor: "bg-green-600",
    icon: chat.type === "building" ? "🏢" : chat.type === "entrance" ? "🚪" : "💬",
    isOfficial: chat.is_official,
  }));

  const messageResult = chats.length === 0
    ? { data: [], error: null }
    : await supabase.from("messages").select("*, sender:profiles(full_name, avatar_url, role)").in("chat_id", chats.map((chat) => chat.id)).order("created_at", { ascending: true }).limit(1000);
  if (messageResult.error) throw messageResult.error;
  const messagesByChat: Record<string, MessageItem[]> = {};
  for (const message of messageResult.data || []) {
    (messagesByChat[message.chat_id] ||= []).push({
      id: message.id,
      chatId: message.chat_id,
      senderId: message.sender_id,
      senderName: message.sender?.full_name || "Сосед",
      senderAvatar: message.sender?.avatar_url || undefined,
      isOfficial: message.sender?.role === "hoa_official",
      isMe: message.sender_id === userId,
      text: message.is_deleted ? "Сообщение удалено" : message.content || "",
      time: new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  const verificationResult = await supabase
    .from("verification_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (verificationResult.error) throw verificationResult.error;
  const verificationRequests: VerificationRequest[] = (verificationResult.data || []).map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    fullName: item.full_name,
    phone: item.phone || "",
    buildingNumber: item.building_number,
    entranceNumber: item.entrance_number,
    apartmentNumber: item.apartment_number,
    documentType: item.document_type,
    documentUrl: item.document_path,
    status: item.status,
    submittedAt: new Date(item.created_at).toLocaleString("ru-RU"),
  }));

  const commentsResult = await supabase
    .from("comments")
    .select("id, post_id, content, created_at, author:profiles(full_name, role)")
    .order("created_at", { ascending: true })
    .limit(500);
  if (commentsResult.error) throw commentsResult.error;
  const postComments: Record<string, Array<{ id: string; authorName: string; isOfficial: boolean; text: string; time: string }>> = {};
  for (const comment of commentsResult.data || []) {
    const author = relation(comment.author);
    (postComments[comment.post_id] ||= []).push({
      id: comment.id,
      authorName: author?.full_name || "Сосед",
      isOfficial: author?.role === "hoa_official",
      text: comment.content,
      time: new Date(comment.created_at).toLocaleString("ru-RU"),
    });
  }

  const posts = await Promise.all((postsResult.data || []).map(async (row: any) => {
    const post = mapPost(row);
    if (post.attachments?.length) {
      post.attachments = await Promise.all(post.attachments.map(async (attachment) => ({
        ...attachment,
        url: await signedMediaUrl(supabase, attachment.url),
      })));
    }
    return post;
  }));
  const classifieds = await Promise.all((classifiedsResult.data || []).map(async (item: any) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    price: item.price == null ? "Договорная" : `${Number(item.price).toLocaleString("ru-RU")} ${item.currency === "KZT" ? "₸" : item.currency}`,
    location: item.location || "ЖК «Солнечный»",
    image: await signedMediaUrl(supabase, item.image_path),
    description: item.description,
    authorId: item.author_id,
    authorName: relation(item.author)?.full_name || "Житель ЖК",
    authorPhone: relation(item.author)?.phone || "",
    createdAt: new Date(item.created_at).toLocaleDateString("ru-RU"),
  })));
  const notifications: AppNotification[] = (notificationsResult.data || []).map((item: any) => ({
    id: item.id,
    type: item.type || "system",
    title: item.title || "Новое уведомление",
    body: item.body || "",
    isRead: Boolean(item.is_read),
    createdAt: new Date(item.created_at).toLocaleString("ru-RU"),
  }));

  return {
    posts,
    chats,
    messages: messagesByChat,
    classifieds,
    verificationRequests,
    postComments,
    notifications,
  };
}
