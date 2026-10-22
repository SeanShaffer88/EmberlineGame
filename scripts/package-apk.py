"""Add DEX and normalize AAPT2 Windows asset paths before alignment/signing."""
import argparse
from pathlib import Path
import zipfile


def package_apk(base, dex, output):
    if Path(base).resolve() == Path(output).resolve():
        raise ValueError('Use a separate output file.')
    names = set()
    with zipfile.ZipFile(base) as source, zipfile.ZipFile(output, 'w') as target:
        for entry in source.infolist():
            # ZipInfo.filename silently converts backslashes on Windows. Inspect
            # orig_filename to catch the actual bytes Android will look up.
            name = entry.orig_filename.replace('\\', '/')
            if name.startswith('/') or '..' in name.split('/') or name in names:
                raise ValueError('Unsafe or duplicate APK entry: ' + name)
            if name == 'classes.dex':
                raise ValueError('The resource APK already contains classes.dex.')
            names.add(name)
            canonical = zipfile.ZipInfo(name, entry.date_time)
            canonical.compress_type = entry.compress_type
            canonical.external_attr = entry.external_attr
            canonical.create_system = entry.create_system
            target.writestr(canonical, source.read(entry))
        target.write(dex, 'classes.dex', compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(output) as check:
        if check.testzip() is not None:
            raise ValueError('Packaged APK failed CRC verification.')
        if any('\\' in entry.orig_filename for entry in check.infolist()):
            raise ValueError('APK still contains Windows path separators.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base')
    parser.add_argument('dex')
    parser.add_argument('output')
    args = parser.parse_args()
    package_apk(args.base, args.dex, args.output)
