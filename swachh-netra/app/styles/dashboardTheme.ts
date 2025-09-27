import { StyleSheet } from "react-native"
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from "./commonStyles"

export const dashboardPalette = {
  heroGradient: ['#0f172a', '#1e293b', '#1d4ed8'],
  heroAccent: '#38bdf8',
  cardPrimary: '#2563eb',
  cardSecondary: '#0ea5e9',
  cardNeutral: '#334155',
}

export const dashboardStyles = StyleSheet.create({
  heroContainer: {
    borderBottomLeftRadius: BORDER_RADIUS.xxxl,
    borderBottomRightRadius: BORDER_RADIUS.xxxl,
    paddingHorizontal: SPACING.xl,
    paddingTop: 32,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextBlock: {
    flex: 1,
    gap: SPACING.sm,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(226, 232, 240, 0.85)',
    lineHeight: 22,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(226, 232, 240, 0.18)',
  },
  heroBadgeText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  heroIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statsContainer: {
    marginTop: -24,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    minWidth: 160,
    ...SHADOWS.sm,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  statCardAccent: {
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.35)',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  statValue: {
    marginTop: SPACING.sm,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  statDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  statDeltaPositive: {
    color: COLORS.success,
    fontWeight: '600',
  },
  statDeltaNegative: {
    color: COLORS.error,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  actionMeta: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.gray500,
  },
})

