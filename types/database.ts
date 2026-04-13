export type Family = {
  id: string;
  name: string;
  family_code: string;
  created_at: string;
};

export type User = {
  id: string;
  name: string;
  family_id: string;
  created_at: string;
};

export type Item = {
  id: string;
  name: string;
  category: string;
  is_recurring: boolean;
  recurrence_type: 'weekly' | 'monthly' | null;
  family_id: string;
  created_at: string;
};

export type ShoppingListItem = {
  id: string;
  item_id: string;
  status: 'pending' | 'bought';
  target_date: string | null;
  family_id: string;
  created_at: string;
  item?: Item;
};

export type PurchaseHistory = {
  id: string;
  item_id: string;
  price: number;
  purchased_at: string;
  family_id: string;
};
