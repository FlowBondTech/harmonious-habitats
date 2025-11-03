import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Shield,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import {
  getSpaceMembers,
  updateSpaceMemberStatus,
  SpaceMember,
  Space,
  supabase
} from '../lib/supabase';
import { LoadingSpinner } from './LoadingStates';
import Avatar from './Avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { format } from 'date-fns';

interface SpaceMemberManagementProps {
  spaces: Space[];
  onMemberUpdate?: () => void;
}

const SpaceMemberManagement: React.FC<SpaceMemberManagementProps> = ({ spaces, onMemberUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadMembers();
  }, [spaces]);

  const loadMembers = async () => {
    if (spaces.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const spaceIds = spaces.map(s => s.id);

      // Load all members for all spaces owned by the user
      const memberPromises = spaceIds.map(spaceId => getSpaceMembers(spaceId));
      const results = await Promise.all(memberPromises);

      // Flatten and combine all members
      const allMembers: SpaceMember[] = [];
      results.forEach((result, index) => {
        if (result.data) {
          result.data.forEach(member => {
            allMembers.push({
              ...member,
              space: spaces[index] // Attach space info
            });
          });
        }
      });

      setMembers(allMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAction = async (
    memberId: string,
    status: 'approved' | 'rejected' | 'removed',
    notes?: string
  ) => {
    try {
      const { error } = await updateSpaceMemberStatus(memberId, status, notes);
      if (error) throw error;

      // Reload members
      await loadMembers();
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error updating member status:', error);
      alert('Failed to update member status. Please try again.');
    }
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    if (selectedSpace !== 'all' && member.space_id !== selectedSpace) return false;
    if (statusFilter !== 'all' && member.status !== statusFilter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.user?.full_name?.toLowerCase().includes(query) ||
        member.user?.email?.toLowerCase().includes(query) ||
        member.space?.name?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const pendingMembers = filteredMembers.filter(m => m.status === 'pending');
  const approvedMembers = filteredMembers.filter(m => m.status === 'approved');
  const rejectedMembers = filteredMembers.filter(m => m.status === 'rejected');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading members..." />
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Spaces Yet</h3>
          <p className="text-gray-500">Create a space to start managing community members</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMembers.length}</div>
            <p className="text-xs text-gray-500">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedMembers.length}</div>
            <p className="text-xs text-gray-500">Across all spaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
            />
          </div>

          {/* Space Filter */}
          <select
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
          >
            <option value="all">All Spaces</option>
            {spaces.map(space => (
              <option key={space.id} value={space.id}>{space.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Members Found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedSpace !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Members will appear here once they apply to join your space communities'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map(member => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <Avatar
                      name={member.user?.full_name || 'Member'}
                      imageUrl={member.user?.avatar_url}
                      size="lg"
                    />

                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-forest-800">
                          {member.user?.full_name || 'Unnamed User'}
                        </h3>
                        <StatusBadge status={member.status} />
                        {member.role !== 'member' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {member.role}
                          </span>
                        )}
                      </div>

                      {member.user?.email && (
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.user.email}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Shield className="h-4 w-4 mr-1" />
                          {member.space?.name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Applied {format(new Date(member.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {member.request_message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700 font-medium mb-1">Application Message:</p>
                          <p className="text-sm text-gray-600">{member.request_message}</p>
                        </div>
                      )}

                      {member.status === 'approved' && member.approved_at && (
                        <p className="text-xs text-green-600">
                          Approved {format(new Date(member.approved_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {member.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleMemberAction(member.id, 'approved')}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleMemberAction(member.id, 'rejected')}
                          className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {member.status === 'approved' && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this member from the community?')) {
                            handleMemberAction(member.id, 'removed', 'Removed by space owner');
                          }
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <UserX className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    removed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Removed' }
  };

  const style = config[status as keyof typeof config] || config.pending;

  return (
    <span className={`px-2 py-1 ${style.bg} ${style.text} text-xs font-medium rounded-full`}>
      {style.label}
    </span>
  );
};

export default SpaceMemberManagement;
