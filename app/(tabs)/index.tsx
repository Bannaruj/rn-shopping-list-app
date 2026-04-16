import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Theme } from '@/constants/Theme';
import { useFamily } from '@/contexts/FamilyContext';
import { supabase } from '@/lib/supabase';
import { Item, ShoppingListItem } from '@/types/database';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'All' | 'Not Bought' | 'Bought';

// The nested joined object
type DashboardItem = ShoppingListItem & { items: Item };

export default function DashboardScreen() {
  const { familyId } = useFamily();
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('Not Bought');
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .select(`
          *,
          items (*)
        `)
        .eq('family_id', familyId);

      if (error) throw error;
      setItems(data as unknown as DashboardItem[]);
    } catch (e: any) {
      Alert.alert('Error loading list', e.message);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchList();

    // Subscribe to realtime changes with a unique channel name
    const channelName = `shopping_list_changes_${familyId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list', filter: `family_id=eq.${familyId}` },
        () => {
          fetchList(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchList, familyId]);

  const toggleStatus = async (id: string, currentStatus: string, item_id: string) => {
    const newStatus = currentStatus === 'pending' ? 'bought' : 'pending';
    
    // Optimistic UI update
    setItems((prev) => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));

    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (e: any) {
      fetchList(); // revert
      Alert.alert('Error', e.message);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Bought') return item.status === 'bought';
    if (filter === 'Not Bought') return item.status === 'pending';
    return true;
  });

  const renderItem = ({ item }: { item: DashboardItem }) => {
    const isBought = item.status === 'bought';
    
    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemContent}>
          <View style={styles.itemTextContainer}>
            <Text style={[styles.itemName, isBought && styles.itemBoughtText]}>{item.items?.name || 'Unknown item'}</Text>
            <Text style={styles.itemCategory}>{item.items?.category || 'Uncategorized'}</Text>
          </View>
          <Checkbox checked={isBought} onValueChange={() => toggleStatus(item.id, item.status, item.item_id)} />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <View style={{ flex: 1, flexDirection: 'row', gap: Theme.spacing.sm }}>
          {(['Not Bought', 'Bought', 'All'] as FilterType[]).map(f => (
            <Button
              key={f}
              title={f}
              variant={filter === f ? 'primary' : 'outline'}
              style={styles.filterButton}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchList} />}
        ListEmptyComponent={
          !loading ? (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No items found in this section.</Text>
             </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  filterContainer: {
    flexDirection: 'column',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
  },
  listContainer: {
    padding: Theme.spacing.md,
  },
  itemCard: {
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  itemBoughtText: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textSecondary,
    opacity: 0.7,
  },
  itemCategory: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
  }
});
