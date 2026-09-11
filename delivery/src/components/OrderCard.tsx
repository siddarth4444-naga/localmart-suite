import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Badge from './ui/Badge';
import Button from './ui/Button';

export interface Order {
  id: string;
  shop_name: string;
  customer_name?: string;
  item_count: number;
  total_amount: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'rejected' | 'cancelled';
  created_at: string;
}

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onUpdateStatus?: () => void;
}

export default function OrderCard({
  order,
  onPress,
  showActions = false,
  onAccept,
  onReject,
  onUpdateStatus,
}: OrderCardProps) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      case 'accepted':
      case 'preparing': 
      case 'ready': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'delivered': return { bg: '#D1FAE5', text: '#059669' };
      case 'rejected':
      case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const statusColors = getStatusColor(order.status);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString();
  };

  const getNextStatusText = () => {
    switch (order.status) {
      case 'accepted': return 'Mark as Preparing';
      case 'preparing': return 'Mark as Ready';
      case 'ready': return 'Mark as Delivered';
      default: return 'Update Status';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
        <Badge 
          text={order.status.toUpperCase()} 
          backgroundColor={statusColors.bg}
          color={statusColors.text}
          size="sm"
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.name}>{order.customer_name || order.shop_name}</Text>
        <Text style={styles.time}>{formatDate(order.created_at)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.items}>{order.item_count} {order.item_count === 1 ? 'item' : 'items'}</Text>
        <Text style={styles.total}>₹{order.total_amount}</Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {order.status === 'pending' ? (
            <View style={styles.actionButtons}>
              <Button 
                title="Reject" 
                variant="danger" 
                onPress={onReject || (() => {})} 
                style={styles.btnSplit}
              />
              <View style={{ width: 12 }} />
              <Button 
                title="Accept" 
                variant="primary" 
                onPress={onAccept || (() => {})} 
                style={styles.btnSplit}
              />
            </View>
          ) : (
            ['accepted', 'preparing', 'ready'].includes(order.status) && (
              <Button 
                title={getNextStatusText()} 
                onPress={onUpdateStatus || (() => {})} 
                fullWidth
              />
            )
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  details: {
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  items: {
    fontSize: 14,
    color: '#4B5563',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  actions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnSplit: {
    flex: 1,
  },
});
