import { Redirect } from 'expo-router';

// The original template's Explore page is replaced by Barangay Updates.
export default function ExploreRedirect() {
  return <Redirect href="/updates" />;
}
