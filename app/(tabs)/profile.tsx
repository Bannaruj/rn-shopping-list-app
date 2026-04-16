import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { supabase } from '@/lib/supabase';
import { useFamily } from '@/contexts/FamilyContext';
import { User, Family } from '@/types/database';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { familyId, userName, familyName, leaveFamily } = useFamily();
  const [members, setMembers] = useState<User[]>([]);
  const [familyCode, setFamilyCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfileData = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    try {
      // Fetch members
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('family_id', familyId)
        .order('name', { ascending: true });

      if (usersError) throw usersError;
      setMembers(usersData as User[]);

      // Fetch family code
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('family_code')
        .eq('id', familyId)
        .single();
        
      if (familyError) throw familyError;
      if (familyData) setFamilyCode(familyData.family_code);

    } catch (e: any) {
      Alert.alert('Error loading profile', e.message);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleLeaveFamily = async () => {
    if (Platform.OS === 'web') {
      const confirmLeave = window.confirm("Are you sure you want to leave this family? You can join again if you have the access code.");
      if (confirmLeave) {
        router.replace('/join');
        leaveFamily();
      }
    } else {
      Alert.alert(
        "Leave Family",
        "Are you sure you want to leave this family? You can join again if you have the access code.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Leave", 
            style: "destructive",
            onPress: () => {
              router.replace('/join');
              leaveFamily();
            }
          }
        ]
      );
    }
  };

  const renderMember = ({ item }: { item: User }) => (
    <View style={styles.memberRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.memberName}>
        {item.name} {item.name === userName ? '(You)' : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>My Details</Text>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{userName}</Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Family Info</Text>
            <Text style={styles.label}>Family Name</Text>
            <Text style={styles.value}>{familyName}</Text>
            
            <Text style={[styles.label, { marginTop: Theme.spacing.sm }]}>Access Code</Text>
            <Text style={styles.valueCode}>{familyCode}</Text>
            <Text style={styles.hint}>Share this code with others to join the family.</Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Members ({members.length})</Text>
            <FlatList
              data={members}
              keyExtractor={item => item.id}
              renderItem={renderMember}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Card>

          <Button 
            title="Leave Family" 
            variant="outline" 
            onPress={handleLeaveFamily}
            style={styles.leaveButton}
            textStyle={{ color: Theme.colors.danger }}
          />
        </ScrollView>
      )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  card: {
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  value: {
    fontSize: 16,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  valueCode: {
    fontSize: 18,
    color: Theme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hint: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  avatarText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  memberName: {
    fontSize: 16,
    color: Theme.colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  leaveButton: {
    marginTop: Theme.spacing.md,
    borderColor: Theme.colors.danger,
    borderWidth: 1,
    backgroundColor: 'transparent',
  }
});
