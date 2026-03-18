export interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  rating: number;
  sold: number;
  category: string;
  isMall?: boolean;
  stock?: number;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
