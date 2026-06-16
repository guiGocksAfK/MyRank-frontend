import React, { useState } from 'react';
import { mediaItems, friends as friendsData } from '../data/mockData';

export default function SocialTab() {
  const [friendsList, setFriendsList] = useState(
    friendsData.map((f) => ({ ...f }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [compareFriend, setCompareFriend] = useState(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);

  const toggleFollow = (friendId) => {
    setFriendsList((prev) =>
      prev.map((f) =>
        f.id === friendId ? { ...f, isFollowing: !f.isFollowing } : f
      )
    );
  };

  const selectCompare = (friend) => {
    setCompareFriend(compareFriend?.id === friend.id ? null : friend);
  };

  const filteredFriends = friendsList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myAvgNote = (
    mediaItems.reduce((sum, item) => sum + item.finalNote, 0) / mediaItems.length
  ).toFixed(1);
  const myMediaCount = mediaItems.length;
  const myTotalHours = Math.round(
    mediaItems.reduce((sum, item) => sum + item.timeMinutes, 0) / 60
  );

  const comparisonItems = mediaItems.slice(0, 6);

  return (
    <div className="mr-space-y-6">
      {/* Header */}
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>👥 Social</h1>

      <div className="mr-social-grid">
        {/* Left - Friends List */}
        <div className="mr-space-y-4">
          <input
            className="mr-input"
            placeholder="🔍 Buscar amigos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="mr-space-y-3 mr-scrollable" style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredFriends.map((friend) => (
              <div
                className={`mr-friend-card ${compareFriend?.id === friend.id ? 'selected' : ''}`}
                key={friend.id}
                onClick={() => selectCompare(friend)}
              >
                <div className="mr-friend-row">
                  <div className="mr-avatar-sm">{friend.avatar}</div>
                  <div className="mr-flex-1 mr-min-w-0">
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {friend.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                      @{friend.username}
                    </div>
                    <div className="mr-flex mr-gap-3 mr-mt-2">
                      <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                        📀 {friend.mediaCount} obras
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--mr-gold)' }}>
                        ⭐ {friend.avgNote.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mr-flex mr-flex-col mr-gap-2">
                    <button
                      className={`mr-btn mr-btn-sm ${friend.isFollowing ? 'mr-btn-outline' : 'mr-btn-gold'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(friend.id);
                      }}
                    >
                      {friend.isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>
                    <button
                      className="mr-btn mr-btn-sm mr-btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCompare(friend);
                      }}
                    >
                      📊 Comparar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Main Content */}
        <div className="mr-space-y-6">
          {/* Comparison Panel */}
          {compareFriend && (
            <div className="mr-card">
              <div className="mr-card-body mr-space-y-4">
                <h3 style={{ fontWeight: 700 }}>
                  📊 Comparação com {compareFriend.name}
                </h3>

                {/* Overall Stats Comparison */}
                <div className="mr-space-y-3">
                  <div>
                    <div className="mr-flex mr-justify-between mr-mb-2" style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--mr-gold)' }}>Você ({myAvgNote})</span>
                      <span>Nota Média</span>
                      <span style={{ color: 'var(--mr-blue-light)' }}>
                        {compareFriend.name} ({compareFriend.avgNote.toFixed(1)})
                      </span>
                    </div>
                    <div className="mr-compare-bar-container">
                      <div className="mr-compare-bar-pair">
                        <div className="mr-compare-bar">
                          <div
                            className="mr-compare-bar-fill-gold"
                            style={{ width: `${(parseFloat(myAvgNote) / 12) * 100}%` }}
                          />
                        </div>
                        <div className="mr-compare-bar">
                          <div
                            className="mr-compare-bar-fill-blue"
                            style={{ width: `${(compareFriend.avgNote / 12) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mr-flex mr-justify-between mr-mb-2" style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--mr-gold)' }}>Você ({myMediaCount})</span>
                      <span>Obras</span>
                      <span style={{ color: 'var(--mr-blue-light)' }}>
                        {compareFriend.name} ({compareFriend.mediaCount})
                      </span>
                    </div>
                    <div className="mr-compare-bar-container">
                      <div className="mr-compare-bar-pair">
                        <div className="mr-compare-bar">
                          <div
                            className="mr-compare-bar-fill-gold"
                            style={{ width: `${(myMediaCount / 250) * 100}%` }}
                          />
                        </div>
                        <div className="mr-compare-bar">
                          <div
                            className="mr-compare-bar-fill-blue"
                            style={{ width: `${(compareFriend.mediaCount / 250) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mr-flex mr-justify-between mr-mb-2" style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--mr-gold)' }}>Você ({myTotalHours}h)</span>
                      <span>Horas</span>
                      <span style={{ color: 'var(--mr-blue-light)' }}>
                        {compareFriend.name} (~{Math.round(compareFriend.mediaCount * 4.5)}h)
                      </span>
                    </div>
                    <div className="mr-compare-bar-container">
                      <div className="mr-compare-bar-pair">
                        <div className="mr-compare-bar">
                          <div
                            className="mr-compare-bar-fill-gold"
                            style={{ width: `${(myTotalHours / 1000) * 100}%` }}
                          />
                        </div>
                        <div className="mr-compare-bar">
                          <div
                            className="mr-compare-bar-fill-blue"
                            style={{ width: `${(Math.round(compareFriend.mediaCount * 4.5) / 1000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item-by-Item Comparison */}
                <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 8 }}>
                  Comparação por obra
                </h4>
                <div className="mr-space-y-2">
                  {comparisonItems.map((item) => {
                    const friendNote = (item.note + (Math.random() - 0.5) * 2).toFixed(1);
                    return (
                      <div key={item.id}>
                        <div className="mr-flex mr-justify-between mr-mb-1" style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--mr-gold)' }}>{item.finalNote.toFixed(1)}</span>
                          <span className="mr-truncate" style={{ flex: 1, textAlign: 'center', margin: '0 8px' }}>
                            {item.title}
                          </span>
                          <span style={{ color: 'var(--mr-blue-light)' }}>{friendNote}</span>
                        </div>
                        <div className="mr-compare-bar-container">
                          <div className="mr-compare-bar-pair">
                            <div className="mr-compare-bar">
                              <div
                                className="mr-compare-bar-fill-gold"
                                style={{ width: `${(item.finalNote / 12) * 100}%` }}
                              />
                            </div>
                            <div className="mr-compare-bar">
                              <div
                                className="mr-compare-bar-fill-blue"
                                style={{ width: `${(parseFloat(friendNote) / 12) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📰 Atividade Recente</h3>
            <div className="mr-space-y-3">
              {friendsList
                .filter((f) => f.isFollowing)
                .map((friend) => (
                  <div className="mr-feed-item" key={friend.id}>
                    <div className="mr-flex mr-items-center mr-gap-3">
                      <div className="mr-avatar-sm">{friend.avatar}</div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {friend.name}
                        </span>
                        <span style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
                          {' '}{friend.recentActivity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Profile Visibility */}
          <div className="mr-card">
            <div className="mr-card-body">
              <div className="mr-setting-row">
                <div>
                  <div className="mr-setting-label">Perfil público</div>
                  <div className="mr-setting-desc">
                    Permitir que outros vejam seu ranking
                  </div>
                </div>
                <button
                  className={`mr-switch ${isProfilePublic ? 'checked' : ''}`}
                  onClick={() => setIsProfilePublic(!isProfilePublic)}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
