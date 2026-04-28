import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Theme } from '@/constants/Theme';
import { useFamily } from '@/contexts/FamilyContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function JoinScreen() {
  const { joinFamily } = useFamily();
  const router = useRouter(); // <--- added useRouter
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [userName, setUserName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleJoin = async () => {
    setErrorMessage('');
    if (!userName.trim() || !familyCode.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    const trimmedCode = familyCode.trim().toUpperCase();
    
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

      // Explicit navigation to tabs
      router.replace('/(tabs)' as any);

    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setErrorMessage('');
    if (!userName.trim() || !familyName.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      let generatedCode = '';
      let isUnique = false;
      let attempts = 0;

      // 1. Generate unique family code
      while (!isUnique && attempts < 10) {
        generatedCode = generateFamilyCode();
        const { data: existing } = await supabase
          .from('families')
          .select('id')
          .eq('family_code', generatedCode)
          .maybeSingle();
        
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate a unique family code. Please try again.');
      }

      // 2. Create family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert([{ name: familyName.trim(), family_code: generatedCode }])
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

      // Alert the user about their new code
      if (Platform.OS === 'web') {
        window.alert(`Family created! Your access code is: ${generatedCode}. Share this with your family members.`);
      } else {
        Alert.alert(
          'Family Created!',
          `Your access code is: ${generatedCode}\n\nShare this with your family members to let them join.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }]
        );
        return; // Don't replace yet, wait for OK if on mobile
      }

      // Explicit navigation to tabs (for web or if Alert didn't return early)
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
            label="Your Name" 
            placeholder="Enter your name" 
            value={userName} 
            onChangeText={setUserName} 
          />

          {mode === 'create' && (
            <Input 
              label="Family Name" 
              placeholder="e.g. The Smiths" 
              value={familyName} 
              onChangeText={setFamilyName} 
            />
          )}

          {mode === 'join' && (
            <Input 
              label="Family Access Code" 
              placeholder="Enter 6-digit code" 
              autoCapitalize="characters"
              value={familyCode} 
              onChangeText={(text) => setFamilyCode(text.toUpperCase())} 
              maxLength={6}
            />
          )}

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
