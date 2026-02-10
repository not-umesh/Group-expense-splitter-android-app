import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import GroupCard from '../../components/GroupCard';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const { groups, expenses, currency } = useStore();
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />

      {/* Summary Header */}
      <LinearGradient
        colors={[Colors.light.primary, '#8B83FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>Total Tracked</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpent, currency)}
          </Text>
          <Text style={styles.summaryDetail}>
            {groups.length} group{groups.length !== 1 ? 's' : ''} · {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <MaterialCommunityIcons name="wallet" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.watermark}>{'</UV>'}</Text>
        </View>
      </LinearGradient>

      {/* Groups List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => router.push(`/group/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="account-group-outline"
            title="No groups yet"
            subtitle="Create your first group to start splitting expenses with friends!"
          />
        }
        contentContainerStyle={groups.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-group')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.light.primary, '#5A52E0']}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  summaryDetail: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.text,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...Shadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
