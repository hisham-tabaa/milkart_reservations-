
from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

# get version from __init__.py
with open("milkart_reservations/__init__.py") as f:
    for line in f:
        if line.startswith("__version__"):
            version = line.split("=")[1].strip().strip('"').strip("'")
            break

setup(
    name="milkart_reservations",
    version=version,
    description="Service Unit Reservation System for Healthcare",
    author="Your Company",
    author_email="your-email@example.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires
)

