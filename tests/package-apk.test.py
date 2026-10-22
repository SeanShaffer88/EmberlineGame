"""Regression for nested Windows paths that Android AssetManager cannot open."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('package_apk', Path(__file__).parents[1] / 'scripts/package-apk.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PackagingTests(unittest.TestCase):
    def test_nested_asset_names_are_android_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            base, dex, output = (root / n for n in ['base.apk', 'classes.dex', 'packaged.apk'])
            dex.write_bytes(b'dex\n035\x00test-fixture')
            with zipfile.ZipFile(base, 'w') as archive:
                # Assign filename explicitly: ZipInfo's constructor otherwise
                # normalizes it and masks this regression on Windows hosts.
                bad = zipfile.ZipInfo()
                bad.filename = bad.orig_filename = 'assets/vendor\\three.module.js'
                bad.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(bad, b'export const renderer = true;')
                archive.writestr('resources.arsc', b'resource-fixture', compress_type=zipfile.ZIP_STORED)
            with zipfile.ZipFile(base) as original:
                self.assertIn('\\', original.infolist()[0].orig_filename)
            module.package_apk(base, dex, output)
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(archive.read('assets/vendor/three.module.js'), b'export const renderer = true;')
                self.assertFalse(any('\\' in e.orig_filename for e in archive.infolist()))
                self.assertEqual(archive.getinfo('resources.arsc').compress_type, zipfile.ZIP_STORED)
                self.assertEqual(archive.read('classes.dex'), dex.read_bytes())
                self.assertIsNone(archive.testzip())


if __name__ == '__main__':
    unittest.main()
