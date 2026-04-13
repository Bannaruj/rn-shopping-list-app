import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Item, PurchaseHistory } from '@/types/database';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFamily } from '@/contexts/FamilyContext';
import { LineChart } from 'react-native-chart-kit';
import { ChevronLeft } from 'lucide-react-native';

const screenWidth = Dimensions.get("window").width;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { familyId } = useFamily();
  
  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [itemRes, historyRes] = await Promise.all([
        supabase.from('items').select('*').eq('id', id).single(),
        supabase.from('purchase_history').select('*').eq('item_id', id).order('purchased_at', { ascending: true })
      ]);

      if (itemRes.error) throw itemRes.error;
      setItem(itemRes.data as Item);
      
      if (!historyRes.error && historyRes.data) {
        setHistory(historyRes.data as PurchaseHistory[]);
      }
    } catch (e: any) {
      Alert.alert('Error loading detail', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid number.');
      return;
    }

    setSavingPrice(true);
    try {
      const { error } = await supabase
        .from('purchase_history')
        .insert([{
          item_id: id,
          family_id: familyId,
          price: price
        }]);

      if (error) throw error;
      setNewPrice('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingPrice(false);
    }
  };

  const chartData = {
    labels: history.length > 0 ? history.map(h => new Date(h.purchased_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) : ['No Data'],
    datasets: [
      {
        data: history.length > 0 ? history.map(h => h.price) : [0],
        color: (opacity = 1) => `rgba(155, 137, 255, ${opacity})`,
        strokeWidth: 2
      }
    ],
  };

  const minPrice = history.length > 0 ? Math.min(...history.map(h => h.price)) : 0;
  const lastPrice = history.length > 0 ? history[history.length - 1].price : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>{item?.name || 'Loading...'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item?.category || 'Category'}</Text>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Last Price</Text>
            <Text style={styles.statValue}>${lastPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Best Price</Text>
            <Text style={[styles.statValue, { color: Theme.colors.success }]}>${minPrice.toFixed(2)}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Price History</Text>
        <Card style={styles.chartCard}>
          {history.length > 0 ? (
            <LineChart
              data={chartData}
              width={screenWidth - Theme.spacing.lg * 4} 
              height={220}
              chartConfig={{
                backgroundColor: Theme.colors.surface,
                backgroundGradientFrom: Theme.colors.surface,
                backgroundGradientTo: Theme.colors.surface,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(155, 137, 255, ${opacity})`,
                labelColor: (opacity = 1) => Theme.colors.textSecondary,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: Theme.colors.primaryLight
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.noDataBox}>
              <Text style={styles.noDataText}>No price history available</Text>
            </View>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Log Purchase</Text>
        <Card style={styles.logCard}>
          <Input 
            placeholder="0.00" 
            label="Price Paid ($)"
            keyboardType="decimal-pad"
            value={newPrice}
            onChangeText={setNewPrice}
          />
          <Button 
            title="Save Price" 
            onPress={handleAddPrice} 
            loading={savingPrice} 
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl + 30, // For notch on iOS usually
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    marginRight: Theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: Theme.spacing.lg,
  },
  badgeText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    padding: 0,
    marginBottom: Theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Theme.colors.border,
  },
  statLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  chartCard: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
  },
  noDataBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  logCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl * 2,
  }
});
