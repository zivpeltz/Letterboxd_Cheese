const API_BASE = '/api';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  createdAt: string;
}

export interface CheeseType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  wikipediaUrl?: string | null;
  thumbnailUrl?: string | null;
  cheeseCount?: number;
}

export interface Cheese {
  id: string;
  name: string;
  slug: string;
  maker: string;
  fatPercentage?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  type?: CheeseType | null;
  stats?: {
    logsCount: number;
    avgRating: number | null;
    likesCount: number;
    ratingHistogram?: Record<string, number>;
  };
  recentReviews?: Array<{
    id: string;
    user: { id: string; username: string; displayName: string; avatarUrl?: string };
    rating: number;
    isLiked: boolean;
    reviewText?: string;
    photoUrl?: string;
    consumedAt: string;
  }>;
  userState?: {
    hasLogged: boolean;
    userRating: number | null;
    userReview?: string | null;
    isLiked: boolean;
    isWishlisted: boolean;
    logId?: string | null;
  } | null;
}

export interface CheeseLog {
  id: string;
  userId: string;
  cheeseId: string;
  consumedAt: string;
  rating: number;
  isLiked: boolean;
  isFirstTaste: boolean;
  reviewText?: string | null;
  photoUrl?: string | null;
  cheese: Cheese;
  user: { id: string; username: string; displayName: string; avatarUrl?: string | null };
}

export interface UserProfile {
  user: User;
  top4: Array<{
    position: number;
    cheese: Cheese;
  }>;
  stats: {
    totalLogs: number;
    uniqueCheeses: number;
    totalReviews: number;
    totalLikes: number;
    totalWishlist: number;
    totalLists: number;
    ratingHistogram: Record<string, number>;
    topTypes: Array<{ name: string; count: number }>;
    topMakers: Array<{ name: string; count: number }>;
  };
  recentLogs: Array<{
    id: string;
    consumedAt: string;
    rating: number;
    isLiked: boolean;
    reviewText?: string;
    photoUrl?: string;
    cheese: Cheese;
  }>;
}

export interface CustomList {
  id: string;
  title: string;
  description?: string | null;
  isRanked: boolean;
  user: { id: string; username: string; displayName: string; avatarUrl?: string | null };
  itemsCount: number;
  previewItems: Array<{
    position: number;
    notes?: string;
    cheese: { id: string; name: string; maker: string; imageUrl?: string };
  }>;
  items?: Array<{
    id: string;
    position: number;
    notes?: string;
    cheese: Cheese;
  }>;
  createdAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cheeseboxd_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(username: string, email: string, password: string, displayName: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, displayName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Cheeses
  async getCheeses(params?: {
    q?: string;
    maker?: string;
    type?: string;
    minFat?: number;
    maxFat?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Cheese[]; pagination: { total: number; totalPages: number; page: number } }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.maker) query.set('maker', params.maker);
    if (params?.type) query.set('type', params.type);
    if (params?.minFat !== undefined) query.set('minFat', params.minFat.toString());
    if (params?.maxFat !== undefined) query.set('maxFat', params.maxFat.toString());
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/cheeses?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch cheeses');
    return res.json();
  },

  async getCheese(idOrSlug: string): Promise<Cheese> {
    const res = await fetch(`${API_BASE}/cheeses/${idOrSlug}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch cheese');
    return res.json();
  },

  async createCheese(data: {
    name: string;
    maker: string;
    typeName: string;
    fatPercentage?: number | null;
    description?: string;
    imageUrl?: string;
  }): Promise<{ cheese: Cheese }> {
    const res = await fetch(`${API_BASE}/cheeses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create cheese');
    }
    return res.json();
  },

  async getCheeseTypes(): Promise<{ types: CheeseType[] }> {
    const res = await fetch(`${API_BASE}/cheeses/types`);
    if (!res.ok) throw new Error('Failed to fetch cheese types');
    return res.json();
  },

  async getMakers(): Promise<{ makers: Array<{ name: string; cheeseCount: number }> }> {
    const res = await fetch(`${API_BASE}/cheeses/makers`);
    if (!res.ok) throw new Error('Failed to fetch makers');
    return res.json();
  },

  // Logs & Diary
  async logCheese(data: {
    cheeseId: string;
    rating: number;
    isLiked?: boolean;
    isFirstTaste?: boolean;
    reviewText?: string | null;
    photoUrl?: string | null;
    consumedAt?: string;
  }): Promise<{ log: CheeseLog }> {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to log cheese');
    }
    return res.json();
  },

  async getLogs(params?: {
    username?: string;
    cheeseId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: CheeseLog[]; pagination: { total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.username) query.set('username', params.username);
    if (params?.cheeseId) query.set('cheeseId', params.cheeseId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  async deleteLog(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete log');
  },

  // Profiles
  async getUserProfile(username: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/${username}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },

  async getUsers(): Promise<{
    users: Array<{
      id: string;
      username: string;
      displayName: string;
      bio?: string | null;
      avatarUrl?: string | null;
      location?: string | null;
      createdAt: string;
      stats: { totalLogs: number };
      top4: Array<{ position: number; cheese: Cheese }>;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async setTopFavorites(cheeseIds: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/users/favorites`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cheeseIds }),
    });
    if (!res.ok) throw new Error('Failed to update favorites');
    return res.json();
  },

  async updateProfile(data: {
    displayName?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Wishlist
  async toggleWishlist(cheeseId: string): Promise<{ isWishlisted: boolean }> {
    const res = await fetch(`${API_BASE}/wishlist/${cheeseId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to update wishlist');
    return res.json();
  },

  async getWishlist(username?: string): Promise<{ items: Array<{ addedAt: string; cheese: Cheese }> }> {
    const query = username ? `?username=${username}` : '';
    const res = await fetch(`${API_BASE}/wishlist${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch wishlist');
    return res.json();
  },

  // Lists
  async getLists(): Promise<{ lists: CustomList[] }> {
    const res = await fetch(`${API_BASE}/lists`);
    if (!res.ok) throw new Error('Failed to fetch lists');
    return res.json();
  },

  async getList(id: string): Promise<{ list: CustomList }> {
    const res = await fetch(`${API_BASE}/lists/${id}`);
    if (!res.ok) throw new Error('Failed to fetch list');
    return res.json();
  },

  async createList(data: {
    title: string;
    description?: string;
    isRanked?: boolean;
    cheeseIds?: string[];
  }): Promise<{ list: CustomList }> {
    const res = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create list');
    return res.json();
  },
};
