import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

// Mock data: Later, you will fetch this from your Next.js/MongoDB backend
const AVAILABLE_ARTISANS = [
  {
    id: "1",
    name: "Opeyemi A.",
    skill: "Expert Plumber",
    rating: "4.9",
    jobs: 124,
  },
  {
    id: "2",
    name: "Chinedu E.",
    skill: "Master Electrician",
    rating: "4.8",
    jobs: 89,
  },
  {
    id: "3",
    name: "Samuel O.",
    skill: "Carpenter & Woodwork",
    rating: "5.0",
    jobs: 42,
  },
];

export default function ArtisanBookingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Find an Artisan</Text>
          <Text style={styles.subtitle}>
            Book verified pros in under 30 minutes
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="What do you need help with?"
            placeholderTextColor="#888"
          />
        </View>

        {/* Categories Grid */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Top Services</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardIcon}>🔧</Text>
              <Text style={styles.cardText}>Plumbing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardIcon}>⚡</Text>
              <Text style={styles.cardText}>Electrical</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* New: Available Artisans Feed */}
        <View style={styles.artisanSection}>
          <Text style={styles.sectionTitle}>Available Pros Near You</Text>

          {AVAILABLE_ARTISANS.map((artisan) => (
            <View key={artisan.id} style={styles.artisanCard}>
              {/* Profile Avatar Placeholder */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{artisan.name.charAt(0)}</Text>
              </View>

              {/* Artisan Details */}
              <View style={styles.artisanInfo}>
                <Text style={styles.artisanName}>{artisan.name}</Text>
                <Text style={styles.artisanSkill}>{artisan.skill}</Text>
                <Text style={styles.artisanStats}>
                  ⭐ {artisan.rating} • {artisan.jobs} jobs completed
                </Text>
              </View>

              {/* Book Button */}
              <TouchableOpacity style={styles.bookButton}>
                <Text style={styles.bookButtonText}>Book</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { padding: 20 },
  header: { marginTop: 40, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
  subtitle: { fontSize: 16, color: "#94A3B8", marginTop: 8 },
  searchContainer: { marginBottom: 32 },
  searchInput: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },

  categorySection: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  grid: { flexDirection: "row", gap: 16 },
  card: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardIcon: { fontSize: 32, marginBottom: 12 },
  cardText: { color: "#FFFFFF", fontWeight: "500", fontSize: 16 },

  // New Artisan List Styles
  artisanSection: { marginBottom: 40 },
  artisanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  artisanInfo: { flex: 1 },
  artisanName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  artisanSkill: { color: "#94A3B8", fontSize: 14, marginBottom: 4 },
  artisanStats: { color: "#FCD34D", fontSize: 12, fontWeight: "500" },
  bookButton: {
    backgroundColor: "#10B981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bookButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
});
