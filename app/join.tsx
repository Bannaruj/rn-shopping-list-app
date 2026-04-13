import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Theme } from '@/constants/Theme';
import { useFamily } from '@/contexts/FamilyContext';
import { supabase } from '@/lib/supabase';
import { ShoppingCart } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function JoinScreen() {
  const { joinFamily } = useFamily();
  const router = useRouter(); // <--- added useRouter
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [userName, setUserName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = async () => {
    setErrorMessage('');
    if (!userName.trim() || !familyCode.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    const trimmedCode = familyCode.trim().toLowerCase();
    
    setLoading(true);
    try {
      // 1. Find family by code
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('family_code', trimmedCode)
        .limit(1)
        .maybeSingle();

      if (familyError) throw familyError;
      if (!familyData) throw new Error(`Family code '${trimmedCode}' not found`);

      // 2. Create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{ name: userName.trim(), family_id: familyData.id }])
        .select()
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('Failed to create user (no data returned)');

      // 3. Save to context
      await joinFamily(familyData.id, familyData.name, userData.id, userData.name);
      
      // Explicit navigation
      router.replace('/(tabs)' as any);

    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setErrorMessage('');
    if (!userName.trim() || !familyCode.trim() || !familyName.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    const trimmedCode = familyCode.trim().toLowerCase();
    
    setLoading(true);
    try {
      // 1. Check if family code exists
      const { data: existing } = await supabase
        .from('families')
        .select('id')
        .eq('family_code', trimmedCode)
        .maybeSingle();

      if (existing) {
        throw new Error(`The family code '${trimmedCode}' is already taken. Choose another one.`);
      }

      // 2. Create family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert([{ name: familyName.trim(), family_code: trimmedCode }])
        .select()
        .single();

      if (familyError) throw familyError;
      if (!familyData) throw new Error('Failed to create family (no data returned)');

      // 3. Create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{ name: userName.trim(), family_id: familyData.id }])
        .select()
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('Failed to create user (no data returned)');

      // 4. Save to context
      await joinFamily(familyData.id, familyData.name, userData.id, userData.name);
      
      // Explicit navigation
      router.replace('/(tabs)' as any);

    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <ShoppingCart color={Theme.colors.primary} size={48} />
          </View>
          <Text style={styles.title}>Family Grocery Manger</Text>
          <Text style={styles.subtitle}>Together, we shop better</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.tabs}>
            <Button 
              title="Join" 
              variant={mode === 'join' ? 'primary' : 'outline'} 
              style={[styles.tabButton, mode !== 'join' && styles.tabButtonInactive]} 
              onPress={() => setMode('join')} 
            />
            <View style={{ width: Theme.spacing.md }} />
            <Button 
              title="Create" 
              variant={mode === 'create' ? 'primary' : 'outline'} 
              style={[styles.tabButton, mode !== 'create' && styles.tabButtonInactive]} 
              onPress={() => setMode('create')} 
            />
          </View>

          <Input 
            label="Name" 
            placeholder="" 
            value={userName} 
            onChangeText={setUserName} 
          />

          {mode === 'create' && (
            <Input 
              label="Family Name" 
              placeholder="" 
              value={familyName} 
              onChangeText={setFamilyName} 
            />
          )}

          <Input 
            label="Family Access Code" 
            placeholder="" 
            autoCapitalize="none"
            value={familyCode} 
            onChangeText={setFamilyCode} 
          />

          <View style={styles.footer}>
            {errorMessage ? (
              <Text style={{color: Theme.colors.danger, marginBottom: 16, textAlign: 'center'}}>{errorMessage}</Text>
            ) : null}
            <Button 
              title={mode === 'join' ? "Join Family" : "Create Family"} 
              onPress={mode === 'join' ? handleJoin : handleCreate} 
              loading={loading}
              style={{ width: '100%' }}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  card: {
    padding: Theme.spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
  },
  tabButtonInactive: {
    borderColor: Theme.colors.border,
  },
  footer: {
    marginTop: Theme.spacing.md,
    alignItems: 'center',
  }
});
