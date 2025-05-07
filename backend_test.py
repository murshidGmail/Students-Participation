import requests
import sys
import random
import string
import json
from datetime import datetime

class StudentParticipationAPITester:
    def __init__(self, base_url="https://3874fa8d-63e8-40c5-90ed-3254b9e872c4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.teacher_id = None
        self.teacher_name = None
        self.tests_run = 0
        self.tests_passed = 0
        self.class_id = None
        self.student_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # For file uploads, don't use JSON
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except json.JSONDecodeError:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def generate_random_email(self):
        """Generate a random email for testing"""
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"test_{random_string}@example.com"

    def test_register(self):
        """Test teacher registration"""
        email = self.generate_random_email()
        success, response = self.run_test(
            "Teacher Registration",
            "POST",
            "register",
            200,
            data={
                "name": "Test Teacher",
                "email": email,
                "password": "Password123!"
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.teacher_id = response.get('teacher_id')
            self.teacher_name = response.get('name')
            print(f"Registration response: {response}")
            return True, email
        return False, None

    def test_login(self, email, password):
        """Test teacher login"""
        url = f"{self.base_url}/token"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing Teacher Login...")
        
        try:
            # Use form data instead of JSON for OAuth2 login
            response = requests.post(
                url, 
                data={"username": email, "password": password},
                headers=headers
            )
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                self.token = response_data['access_token']
                self.teacher_id = response_data['teacher_id']
                self.teacher_name = response_data['name']
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_create_class(self, class_name):
        """Test creating a class"""
        success, response = self.run_test(
            "Create Class",
            "POST",
            "classes",
            200,
            data={"name": class_name}
        )
        if success and 'id' in response:
            self.class_id = response['id']
            return True
        return False

    def test_get_classes(self):
        """Test getting all classes"""
        success, response = self.run_test(
            "Get Classes",
            "GET",
            "classes",
            200
        )
        return success

    def test_get_class(self):
        """Test getting a specific class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, _ = self.run_test(
            "Get Class by ID",
            "GET",
            f"classes/{self.class_id}",
            200
        )
        return success

    def test_add_student(self, name, student_number):
        """Test adding a student to a class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, response = self.run_test(
            "Add Student",
            "POST",
            f"classes/{self.class_id}/students",
            200,
            data={
                "name": name,
                "student_number": student_number
            }
        )
        if success and 'id' in response:
            self.student_id = response['id']
            return True
        return False

    def test_upload_students(self):
        """Test uploading students via CSV"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        # Create a simple CSV content
        csv_content = "name,student_number\nStudent 1,S001\nStudent 2,S002\nStudent 3,S003"
        
        success, _ = self.run_test(
            "Upload Students",
            "POST",
            f"classes/{self.class_id}/students/upload",
            200,
            data={"content": csv_content}
        )
        return success

    def test_get_students(self):
        """Test getting all students in a class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Students",
            "GET",
            f"classes/{self.class_id}/students",
            200
        )
        return success

    def test_get_random_student(self):
        """Test getting a random student for assessment"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Random Student",
            "GET",
            f"classes/{self.class_id}/random-student",
            200
        )
        if success and 'id' in response:
            self.random_student_id = response['id']
            return True
        return False

    def test_create_assessment(self, score):
        """Test creating an assessment for a student"""
        if not self.class_id or not self.student_id:
            print("❌ No class ID or student ID available for testing")
            return False
        
        success, _ = self.run_test(
            "Create Assessment",
            "POST",
            f"classes/{self.class_id}/assessments",
            200,
            data={
                "student_id": self.student_id,
                "score": score
            }
        )
        return success

    def test_get_assessments(self):
        """Test getting all assessments for a class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, _ = self.run_test(
            "Get Assessments",
            "GET",
            f"classes/{self.class_id}/assessments",
            200
        )
        return success

    def test_get_statistics(self):
        """Test getting statistics for a class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, _ = self.run_test(
            "Get Class Statistics",
            "GET",
            f"classes/{self.class_id}/statistics",
            200
        )
        return success

    def test_delete_all_students(self):
        """Test deleting all students in a class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, _ = self.run_test(
            "Delete All Students",
            "DELETE",
            f"classes/{self.class_id}/students",
            200
        )
        return success

    def test_delete_class(self):
        """Test deleting a class"""
        if not self.class_id:
            print("❌ No class ID available for testing")
            return False
        
        success, _ = self.run_test(
            "Delete Class",
            "DELETE",
            f"classes/{self.class_id}",
            200
        )
        if success:
            self.class_id = None
            return True
        return False

def main():
    # Setup
    tester = StudentParticipationAPITester()
    
    # Test teacher registration
    password = "Password123!"
    success, email = tester.test_register()
    
    if not success:
        print("❌ Teacher registration failed, stopping tests")
        return 1

    # Test login with the registered teacher
    if not tester.test_login(email, password):
        print("❌ Teacher login failed, stopping tests")
        return 1

    # Test class creation
    class_name = f"Test Class {datetime.now().strftime('%H%M%S')}"
    if not tester.test_create_class(class_name):
        print("❌ Class creation failed, stopping tests")
        return 1

    # Test getting classes
    if not tester.test_get_classes():
        print("❌ Getting classes failed")
        return 1

    # Test getting a specific class
    if not tester.test_get_class():
        print("❌ Getting specific class failed")
        return 1

    # Test adding a student
    if not tester.test_add_student("Test Student", f"S{datetime.now().strftime('%H%M%S')}"):
        print("❌ Adding student failed")
        return 1

    # Test uploading students
    if not tester.test_upload_students():
        print("❌ Uploading students failed")
        return 1

    # Test getting students
    if not tester.test_get_students():
        print("❌ Getting students failed")
        return 1

    # Test getting a random student
    if not tester.test_get_random_student():
        print("❌ Getting random student failed")
        return 1

    # Test creating an assessment (correct answer)
    if not tester.test_create_assessment(1):
        print("❌ Creating assessment (correct) failed")
        return 1

    # Test creating an assessment (wrong answer)
    if not tester.test_create_assessment(0):
        print("❌ Creating assessment (wrong) failed")
        return 1

    # Test getting assessments
    if not tester.test_get_assessments():
        print("❌ Getting assessments failed")
        return 1

    # Test getting statistics
    if not tester.test_get_statistics():
        print("❌ Getting statistics failed")
        return 1

    # Test deleting all students
    if not tester.test_delete_all_students():
        print("❌ Deleting all students failed")
        return 1

    # Test deleting the class
    if not tester.test_delete_class():
        print("❌ Deleting class failed")
        return 1

    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())