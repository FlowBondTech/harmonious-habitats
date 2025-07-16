import React, { useState } from 'react';
import { Plus, X, Star, GraduationCap, Users, BookOpen, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { ProfileSkill } from '../lib/supabase';

interface ProfileSkillsSectionProps {
  skills: ProfileSkill[];
  onSkillsUpdate: (skills: ProfileSkill[]) => void;
  isEditing: boolean;
}

const ProfileSkillsSection: React.FC<ProfileSkillsSectionProps> = ({
  skills,
  onSkillsUpdate,
  isEditing
}) => {
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));
  const [newSkill, setNewSkill] = useState<Partial<ProfileSkill>>({
    skill: '',
    category: 'gardening',
    experience_level: 'beginner',
    can_teach: false,
    want_to_learn: false,
    years_experience: 0,
    description: ''
  });

  const skillCategories = [
    { id: 'gardening', name: 'Gardening & Sustainability', color: 'bg-green-100 text-green-800' },
    { id: 'yoga', name: 'Yoga & Meditation', color: 'bg-purple-100 text-purple-800' },
    { id: 'cooking', name: 'Cooking & Nutrition', color: 'bg-orange-100 text-orange-800' },
    { id: 'art', name: 'Art & Creativity', color: 'bg-pink-100 text-pink-800' },
    { id: 'healing', name: 'Healing & Wellness', color: 'bg-blue-100 text-blue-800' },
    { id: 'music', name: 'Music & Movement', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'crafts', name: 'Crafts & Making', color: 'bg-amber-100 text-amber-800' },
    { id: 'technology', name: 'Technology & Digital', color: 'bg-gray-100 text-gray-800' },
    { id: 'business', name: 'Business & Finance', color: 'bg-teal-100 text-teal-800' },
    { id: 'lifestyle', name: 'Lifestyle & Personal Development', color: 'bg-rose-100 text-rose-800' },
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Just starting out', stars: 1 },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience', stars: 2 },
    { value: 'advanced', label: 'Advanced', description: 'Highly skilled', stars: 3 },
    { value: 'expert', label: 'Expert', description: 'Can teach others', stars: 4 },
  ];

  const addSkill = () => {
    if (!newSkill.skill || !newSkill.category) return;
    
    const skill: ProfileSkill = {
      skill: newSkill.skill!,
      category: newSkill.category!,
      experience_level: newSkill.experience_level!,
      can_teach: newSkill.can_teach!,
      want_to_learn: newSkill.want_to_learn!,
      years_experience: newSkill.years_experience,
      description: newSkill.description
    };
    
    onSkillsUpdate([...skills, skill]);
    setNewSkill({
      skill: '',
      category: 'gardening',
      experience_level: 'beginner',
      can_teach: false,
      want_to_learn: false,
      years_experience: 0,
      description: ''
    });
    setShowAddSkill(false);
  };

  const removeSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onSkillsUpdate(updatedSkills);
  };

  const updateSkill = (index: number, updates: Partial<ProfileSkill>) => {
    const updatedSkills = skills.map((skill, i) => 
      i === index ? { ...skill, ...updates } : skill
    );
    onSkillsUpdate(updatedSkills);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSkillsByCategory = () => {
    const grouped = skills.reduce((acc, skill, index) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push({ skill, index });
      return acc;
    }, {} as Record<string, Array<{ skill: ProfileSkill; index: number }>>);
    return grouped;
  };

  const skillsByCategory = getSkillsByCategory();
  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-blue-600 bg-blue-50';
      case 'advanced': return 'text-purple-600 bg-purple-50';
      case 'expert': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-forest-600" />
          <h3 className="text-xl font-semibold text-forest-800">Skills & Expertise</h3>
        </div>
        {isEditing && (
          <button
            onClick={() => setShowAddSkill(true)}
            className="flex items-center space-x-2 text-sm bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Skill</span>
          </button>
        )}
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-8">
          <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No skills added yet</p>
          {isEditing && (
            <button
              onClick={() => setShowAddSkill(true)}
              className="mt-3 text-forest-600 hover:text-forest-700"
            >
              Add your first skill
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Skills Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-forest-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-forest-800">{skills.length}</div>
              <div className="text-sm text-forest-600">Total Skills</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {skills.filter(s => s.can_teach).length}
              </div>
              <div className="text-sm text-blue-600">Can Teach</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-800">
                {skills.filter(s => s.experience_level === 'expert' || s.experience_level === 'advanced').length}
              </div>
              <div className="text-sm text-purple-600">Advanced+</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-800">
                {skills.filter(s => s.want_to_learn).length}
              </div>
              <div className="text-sm text-orange-600">Learning</div>
            </div>
          </div>

          {/* Skills by Category */}
          {skillCategories.map(category => {
            const categorySkills = skillsByCategory[category.id] || [];
            if (categorySkills.length === 0) return null;

            const isExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="border border-forest-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 bg-forest-50 hover:bg-forest-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                      {category.name}
                    </span>
                    <span className="text-sm text-forest-600">
                      {categorySkills.length} skill{categorySkills.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? 
                    <ChevronUp className="h-4 w-4 text-forest-600" /> : 
                    <ChevronDown className="h-4 w-4 text-forest-600" />
                  }
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {categorySkills.map(({ skill, index }) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-forest-800">{skill.skill}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(skill.experience_level)}`}>
                                {skill.experience_level}
                              </span>
                              <div className="flex items-center space-x-1">
                                {[...Array(experienceLevels.find(l => l.value === skill.experience_level)?.stars || 1)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-earth-400 fill-current" />
                                ))}
                              </div>
                            </div>

                            {skill.description && (
                              <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                            )}

                            <div className="flex items-center space-x-4 text-sm">
                              {skill.years_experience && skill.years_experience > 0 && (
                                <span className="flex items-center space-x-1 text-forest-600">
                                  <Award className="h-3 w-3" />
                                  <span>{skill.years_experience} years</span>
                                </span>
                              )}
                              {skill.can_teach && (
                                <span className="flex items-center space-x-1 text-blue-600">
                                  <Users className="h-3 w-3" />
                                  <span>Can teach</span>
                                </span>
                              )}
                              {skill.want_to_learn && (
                                <span className="flex items-center space-x-1 text-purple-600">
                                  <BookOpen className="h-3 w-3" />
                                  <span>Learning</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {isEditing && (
                            <button
                              onClick={() => removeSkill(index)}
                              className="ml-4 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkill && isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800">Add New Skill</h3>
                <button
                  onClick={() => setShowAddSkill(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Skill Name */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={newSkill.skill}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, skill: e.target.value }))}
                    placeholder="e.g., Organic Vegetable Gardening, Hatha Yoga, Fermentation"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  >
                    {skillCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-3">
                    Experience Level *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {experienceLevels.map(level => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setNewSkill(prev => ({ ...prev, experience_level: level.value as any }))}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          newSkill.experience_level === level.value
                            ? 'border-forest-300 bg-forest-50'
                            : 'border-gray-200 hover:border-forest-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{level.label}</span>
                          <div className="flex">
                            {[...Array(level.stars)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-earth-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Years of Experience (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newSkill.years_experience || ''}
                    onChange={(e) => setNewSkill(prev => ({ 
                      ...prev, 
                      years_experience: e.target.value ? parseInt(e.target.value) : 0 
                    }))}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={newSkill.description}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your experience, specializations, or what makes your approach unique..."
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                {/* Teaching & Learning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSkill.can_teach}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, can_teach: e.target.checked }))}
                      className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
                    />
                    <div>
                      <div className="font-medium text-forest-800">I can teach this</div>
                      <div className="text-sm text-gray-600">Willing to share knowledge with others</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSkill.want_to_learn}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, want_to_learn: e.target.checked }))}
                      className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
                    />
                    <div>
                      <div className="font-medium text-forest-800">I want to improve</div>
                      <div className="text-sm text-gray-600">Looking to learn more about this</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={addSkill}
                  disabled={!newSkill.skill || !newSkill.category}
                  className="flex-1 bg-forest-600 hover:bg-forest-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Add Skill
                </button>
                <button
                  onClick={() => setShowAddSkill(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSkillsSection; 