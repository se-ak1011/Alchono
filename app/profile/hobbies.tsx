import { Redirect } from 'expo-router';

/**
 * Retired — hobbies now live in the Personal File (the File's details page
 * edits the same `preferences.hobbies`). Any lingering link lands on the File.
 */
export default function HobbiesScreen() {
  return <Redirect href="/profile/file" />;
}
