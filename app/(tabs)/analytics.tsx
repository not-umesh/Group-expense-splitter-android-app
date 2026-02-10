import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, ExpenseCategories } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { getSpendingByCategory, getMonthlySpending, getTotalSpending } from '../../utils/settlement';
import { formatCurrency } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
    const { expenses, currency } = useStore();

    if (expenses.length === 0) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <EmptyState
                    icon="chart-bar"
                    title="No data yet"
                    subtitle="Add some expenses to see your spending analytics and insights."
                />
            </View>
        );
    }

    const totalSpent = getTotalSpending(expenses);
    const categoryData = getSpendingByCategory(expenses);
    const monthlyData = getMonthlySpending(expenses);

    const pieData = categoryData.map((item) => {
        const cat = ExpenseCategories.find((c) => c.key === item.category);
        return {
            name: cat?.label || item.category,
            amount: item.amount,
            color: cat?.color || '#6B7280',
            legendFontColor: Colors.light.textSecondary,
            legendFontSize: 12,
        };
    });

    const barData = {
        labels: monthlyData.map((m) => {
            const [, month] = m.month.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[parseInt(month, 10) - 1];
        }),
        datasets: [{ data: monthlyData.map((m) => m.amount) }],
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="dark-content" />

            {/* Total Card */}
            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Spending</Text>
                <Text style={styles.totalAmount}>{formatCurrency(totalSpent, currency)}</Text>
                <Text style={styles.totalDetail}>
                    Across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Category Breakdown */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>By Category</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={{
                        color: () => Colors.light.primary,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="0"
                    absolute
                />
            </View>

            {/* Monthly Trend */}
            {monthlyData.length > 1 && (
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Monthly Trend</Text>
                    <BarChart
                        data={barData}
                        width={screenWidth - 64}
                        height={220}
                        yAxisLabel={currency}
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: Colors.light.surface,
                            backgroundGradientFrom: Colors.light.surface,
                            backgroundGradientTo: Colors.light.surface,
                            decimalPlaces: 0,
                            color: () => Colors.light.primary,
                            labelColor: () => Colors.light.textSecondary,
                            barPercentage: 0.7,
                            propsForBackgroundLines: {
                                strokeDasharray: '',
                                stroke: Colors.light.border,
                            },
                        }}
                        style={{ borderRadius: BorderRadius.md }}
                    />
                </View>
            )}

            {/* Category List */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Category Breakdown</Text>
                {categoryData.map((item) => {
                    const cat = ExpenseCategories.find((c) => c.key === item.category);
                    const percent = ((item.amount / totalSpent) * 100).toFixed(1);
                    return (
                        <View key={item.category} style={styles.categoryRow}>
                            <View style={[styles.categoryDot, { backgroundColor: cat?.color || '#6B7280' }]} />
                            <Text style={styles.categoryName}>{cat?.label || item.category}</Text>
                            <Text style={styles.categoryPercent}>{percent}%</Text>
                            <Text style={styles.categoryAmount}>{formatCurrency(item.amount, currency)}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    totalCard: {
        backgroundColor: Colors.light.primary,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadows.md,
    },
    totalLabel: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    totalAmount: {
        fontSize: FontSize.hero,
        fontWeight: '800',
        color: '#FFF',
        marginTop: 4,
    },
    totalDetail: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    chartCard: {
        backgroundColor: Colors.light.surface,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    chartTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.sm,
    },
    categoryName: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.light.text,
    },
    categoryPercent: {
        fontSize: FontSize.sm,
        color: Colors.light.textSecondary,
        marginRight: Spacing.md,
    },
    categoryAmount: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.light.text,
    },
});
