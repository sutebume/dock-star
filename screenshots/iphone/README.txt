Put raw, UNCROPPED iPhone screenshots here (straight from the phone).

Then run, from the project root:

  powershell -ExecutionPolicy Bypass -File scripts/make-appstore-screenshots.ps1 -In screenshots/iphone -Out screenshots/appstore

Output lands in screenshots/appstore at 1290x2796, numbered 01.png, 02.png...
in filename order, ready to upload to App Store Connect.

Do not crop or resize before running this - any iPhone screenshot is already
the right aspect ratio, and cropping is what causes content to be cut off.
