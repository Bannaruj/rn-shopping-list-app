import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/contexts/FamilyContext';
import { Item } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

export default function ItemsScreen() {
  const { familyId } = useFamily();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const fetchItems = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('family_id', familyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data as Item[]);
    } catch (e: any) {
      Alert.alert('Error loading items', e.message);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemCategory.trim()) {
      Alert.alert('Error', 'Please enter name and category');
      return;
    }

    setSaving(true);
    try {
      // 1. Create item
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert([{ 
          name: newItemName, 
          category: newItemCategory, 
          is_recurring: isRecurring,
          family_id: familyId
        }])
        .select()
        .single();

      if (itemError) throw itemError;

      // 2. Add to shopping list initially
      const { error: listError } = await supabase
        .from('shopping_list')
        .insert([{
          item_id: itemData.id,
          family_id: familyId,
          status: 'pending'
        }]);

      if (listError) throw listError;

      // Reset & Reload
      setNewItemName('');
      setNewItemCategory('');
      setIsRecurring(false);
      setModalVisible(false);
      fetchItems();
      
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity onPress={() => router.push(`/item/${item.id}` as any)} activeOpacity={0.7}>
      <Card style={styles.itemCard}>
        <View style={styles.itemContent}>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              {item.is_recurring && (
                <View style={[styles.categoryBadge, styles.recurringBadge]}>
                  <Text style={[styles.categoryText, {color: Theme.colors.primary}]}>Recurring</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight color={Theme.colors.textSecondary} size={20} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Items List</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchItems} />}
        ListEmptyComponent={
          !loading ? (
             <View style={{ padding: 20, alignItems: 'center' }}>
               <Text style={{ color: Theme.colors.textSecondary }}>No items yet. Add one!</Text>
             </View>
          ) : null
        }
      />

      <View style={styles.fabContainer}>
        <Button 
          title="Add Item" 
          onPress={() => setModalVisible(true)} 
          style={styles.fab}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Grocery Item</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Input 
              label="Item Name" 
              placeholder="E.g. Milk" 
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <Input 
              label="Category" 
              placeholder="E.g. Dairy" 
              value={newItemCategory}
              onChangeText={setNewItemCategory}
            />
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Is this a recurring item?</Text>
              <Toggle value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            <Button 
              title="Save Item" 
              onPress={handleAddItem} 
              loading={saving}
              style={{ marginTop: Theme.spacing.lg }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  pageHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  listContainer: {
    padding: Theme.spacing.md,
    paddingBottom: 100, // For FAB
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
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recurringBadge: {
    backgroundColor: Theme.colors.primaryLight,
  },
  categoryText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    bottom: Theme.spacing.xl,
    left: Theme.spacing.lg,
    right: Theme.spacing.lg,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  closeText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: Theme.spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  toggleLabel: {
    fontSize: 16,
    color: Theme.colors.text,
  }
});
