const users = [];

const addUser = ({ id, name, room }) => {
  // 이름과 방 이름에서 공백 제거
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // 이미 같은 이름과 방 이름을 가진 사용자가 있는지 검사
  const existingUser = users.find(
    (user) => user.room === room && user.name === name
  );

  // 이름과 방 이름이 주어졌는지, 이미 같은 이름과 방 이름을 가진 사용자가 없는지 검사
  if (!name || !room) return { error: '사용자 이름과 방 이름이 필요합니다.' };
  if (existingUser) return { error: '이미 같은 이름과 방 이름을 가진 사용자가 있습니다.' };

  // 사용자 정보 객체 생성
  const user = { id, name, room };

  // 사용자 정보를 배열에 추가
  users.push(user);

  // 사용자 정보 객체 반환
  return { user };
};

const removeUser = (id) => {
  // 사용자 배열에서 해당 ID를 가진 사용자 찾기
  const index = users.findIndex((user) => user.id === id);

  // 해당 사용자를 배열에서 제거하고 반환
  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => {
    return users.find((user) => user.id === id);
  };

const getUsersInRoom = (room) => {
  // 해당 방 이름을 가진 사용자들만 반환
  return users.filter((user) => user.room === room);
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom };