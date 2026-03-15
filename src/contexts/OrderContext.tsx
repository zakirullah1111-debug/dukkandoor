import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, OrderStatus } from '@/types';
import { mockOrders } from '@/data/mockData';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, riderId?: string) => void;
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByShop: (shopId: string) => Order[];
  getPendingOrdersForRiders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);

  const updateOrderStatus = (orderId: string, status: OrderStatus, riderId?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, status, ...(riderId ? { rider_id: riderId } : {}) };
    }));
  };

  const getOrdersByCustomer = (customerId: string) => orders.filter(o => o.customer_id === customerId);
  const getOrdersByShop = (shopId: string) => orders.filter(o => o.shop_id === shopId);
  const getPendingOrdersForRiders = () => orders.filter(o => o.status === 'confirmed' && !o.rider_id);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrdersByCustomer, getOrdersByShop, getPendingOrdersForRiders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};
