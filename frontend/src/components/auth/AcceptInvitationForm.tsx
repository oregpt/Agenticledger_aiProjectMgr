import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import invitationsApi, { type InvitationDetails } from '@/api/invitations.api';

export function AcceptInvitationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuthStore();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await invitationsApi.getByToken(token);
        if (response.success && response.data) {
          setInvitation(response.data);
        } else {
          setError(response.error?.message || 'Invalid invitation');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Invalid or expired invitation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setError('');

    try {
      const response = await invitationsApi.accept(token);
      if (response.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.error?.message || 'Failed to accept invitation');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An error occurred');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error && !invitation) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Invalid invitation</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Go to sign in
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (!invitation) return null;

  // User is not logged in - redirect to register with invitation token
  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">You're invited!</CardTitle>
          <CardDescription>
            {invitation.invitedBy.firstName} {invitation.invitedBy.lastName} has invited you to join{' '}
            <strong>{invitation.organization.name}</strong> as a <strong>{invitation.role.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create an account or sign in to accept this invitation.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Link to={`/register?invitation=${token}`} className="w-full">
            <Button className="w-full">Create account</Button>
          </Link>
          <Link to={`/login?redirect=/accept-invitation?token=${token}`} className="w-full">
            <Button variant="outline" className="w-full">
              Sign in to existing account
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // User is logged in - show accept invitation card
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Join organization</CardTitle>
        <CardDescription>
          You've been invited to join <strong>{invitation.organization.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center space-x-3">
            {invitation.organization.logoUrl ? (
              <img
                src={invitation.organization.logoUrl}
                alt={invitation.organization.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {invitation.organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium">{invitation.organization.name}</p>
              <p className="text-sm text-muted-foreground">@{invitation.organization.slug}</p>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">Your role</p>
            <p className="font-medium">{invitation.role.name}</p>
            {invitation.role.description && (
              <p className="text-sm text-muted-foreground mt-1">{invitation.role.description}</p>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">Invited by</p>
            <p className="font-medium">
              {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{invitation.invitedBy.email}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
          Decline
        </Button>
        <Button className="flex-1" onClick={handleAccept} disabled={isAccepting}>
          {isAccepting ? 'Accepting...' : 'Accept invitation'}
        </Button>
      </CardFooter>
    </Card>
  );
}
