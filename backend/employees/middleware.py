from django.http import JsonResponse
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

class CheckActiveUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip authentication check for public endpoints
        public_endpoints = ['/api/login/', '/api/current-user/']
        if request.path in public_endpoints:
            return self.get_response(request)
        
        # Try to authenticate with token
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token_string = auth_header.split(' ')[1]
            try:
                # Try Token Authentication
                auth = TokenAuthentication()
                auth_tuple = auth.authenticate_credentials(token_string)
                user = auth_tuple[0]
                
                # Check if user is active
                if not user.is_active:
                    return JsonResponse({"error": "Account is disabled."}, status=403)
            except Exception:
                # Invalid token - let the view handle it
                pass
        
        return self.get_response(request)