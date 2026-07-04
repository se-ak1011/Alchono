# Companion PNG drop folder

This pull request intentionally does not include PNG binaries because the PR flow reports `binary files are not supported`.

Add the transparent PNG companion assets here with these exact filenames:

- `image_01_standing.png`
- `image_02_armchair.png`
- `image_05_journal.png`
- `image_06_reading.png`
- `image_14_elbows_knees.png`
- `image_19_small_smile.png`

The UI references these filenames sparingly through `CompanionImage`. If an image cannot be loaded at runtime, the component hides it.
